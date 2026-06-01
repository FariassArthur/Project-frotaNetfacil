const { all, run, sqlDate } = require('../database/connection');
const { notifyVencimentos, isConfigured } = require('./email');

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
let intervalId = null;

async function checkVencimentos() {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const daqui7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    const items = [];

    // CNHs vencendo em 7 dias
    const cnhs = await all(`SELECT nome, validade FROM cnhs WHERE validade BETWEEN ? AND ?`, [hoje, daqui7]);
    for (const c of cnhs) {
      items.push({ tipo: 'CNH', titulo: c.nome, veiculo_id: null, data: c.validade, dias_atraso: 0 });
    }

    // Seguros vencendo
    const seguros = await all(`
      SELECT cs.numero_apolice, cs.data_final_contrato, v.placa
      FROM contratos_seguro cs LEFT JOIN veiculos v ON cs.veiculo_id = v.placa
      WHERE cs.ativo = 1 AND cs.data_final_contrato BETWEEN ? AND ?
    `, [hoje, daqui7]);
    for (const s of seguros) {
      items.push({ tipo: 'Seguro', titulo: `Apólice ${s.numero_apolice}`, veiculo_id: s.placa, data: s.data_final_contrato, dias_atraso: 0 });
    }

    // Multas vencidas
    const multas = await all(`
      SELECT id, veiculo_id, valor, data_vencimento FROM multas
      WHERE data_vencimento < ? AND (pagamento_realizado IS NULL OR pagamento_realizado = 0)
    `, [hoje]);
    for (const m of multas) {
      const dias = Math.floor((new Date(hoje) - new Date(m.data_vencimento)) / (1000 * 60 * 60 * 24));
      items.push({ tipo: 'Multa', titulo: `R$ ${Number(m.valor).toFixed(2)}`, veiculo_id: m.veiculo_id, data: m.data_vencimento, dias_atraso: dias });
    }

    // Documentos vencidos
    const docs = await all(`
      SELECT id, veiculo_id, descricao, valor, data_vencimento FROM pagamento_documentos
      WHERE data_vencimento < ? AND data_pagamento IS NULL
    `, [hoje]);
    for (const d of docs) {
      const dias = Math.floor((new Date(hoje) - new Date(d.data_vencimento)) / (1000 * 60 * 60 * 24));
      items.push({ tipo: 'Documento', titulo: d.descricao || 'Documento', veiculo_id: d.veiculo_id, data: d.data_vencimento, dias_atraso: dias });
    }

    if (items.length > 0) {
      console.log(`[Cron] ${items.length} vencimento(s) encontrado(s).`);
      const emailSent = await notifyVencimentos(items);
      if (emailSent) console.log('[Cron] E-mail de notificação enviado.');
    }
  } catch (err) {
    console.error('[Cron] Erro ao verificar vencimentos:', err.message || err);
  }
}

async function checkManutencaoPreventiva() {
  try {
    const hoje = new Date().toISOString().slice(0, 10);

    const alertas = await all(`
      SELECT c.*, v.placa, v.fipe_modelo, v.km as km_atual
      FROM config_manutencao_preventiva c
      JOIN veiculos v ON c.veiculo_id = v.placa
      WHERE c.ativo = 1
        AND (
          (c.km_proxima IS NOT NULL AND v.km >= c.km_proxima)
          OR
          (c.data_proxima IS NOT NULL AND c.data_proxima <= ?)
        )
    `, [hoje]);

    if (alertas.length > 0) {
      console.log(`[Cron] Manutenção preventiva: ${alertas.length} veículo(s) precisam de manutenção.`);
      for (const a of alertas) {
        console.log(`  → ${a.placa} (${a.fipe_modelo || 'N/I'}) — KM: ${a.km_atual}/${a.km_proxima} | Data: ${a.data_proxima || '-'}`);
      }
    }

    const proximos = await all(`
      SELECT c.*, v.placa, v.fipe_modelo, v.km as km_atual
      FROM config_manutencao_preventiva c
      JOIN veiculos v ON c.veiculo_id = v.placa
      WHERE c.ativo = 1
        AND (
          (c.km_proxima IS NOT NULL AND v.km >= (c.km_proxima - COALESCE(c.km_intervalo, 10000) * 0.1) AND v.km < c.km_proxima)
          OR
          (c.data_proxima IS NOT NULL AND c.data_proxima > ? AND c.data_proxima <= ${sqlDate("?,'+7 days'")})
        )
    `, [hoje, hoje]);

    if (proximos.length > 0) {
      console.log(`[Cron] ${proximos.length} veículo(s) próximos da manutenção preventiva.`);
    }
  } catch (err) {
    console.error('[Cron] Erro ao verificar manutenção preventiva:', err.message || err);
  }
}

async function checkAbastecimentoAlertas() {
  try {
    const rows = await all(`
      SELECT a.veiculo_id, v.placa, v.fipe_modelo,
             AVG(a.quantidade) as media_quantidade,
             COUNT(a.id) as total_abastecimentos
      FROM abastecimentos a
      JOIN veiculos v ON a.veiculo_id = v.placa
      WHERE a.quantidade > 0
      GROUP BY a.veiculo_id
      HAVING COUNT(a.id) >= 3
    `);

    for (const row of rows) {
      const consumos = await all(`
        SELECT a1.km as km_atual, a2.km as km_anterior,
               a1.quantidade, a1.data
        FROM abastecimentos a1
        JOIN abastecimentos a2 ON a2.id = (
          SELECT MAX(id) FROM abastecimentos
          WHERE veiculo_id = a1.veiculo_id AND id < a1.id AND km IS NOT NULL
        )
        WHERE a1.veiculo_id = ? AND a1.km IS NOT NULL AND a2.km IS NOT NULL
          AND a1.quantidade > 0
        ORDER BY a1.data DESC LIMIT 5
      `, [row.veiculo_id]);

      if (consumos.length < 2) continue;

      const medias = consumos.map(c => (c.km_atual - c.km_anterior) / c.quantidade).filter(v => v > 0 && v < 50);
      if (medias.length === 0) continue;

      const mediaGeral = medias.reduce((s, v) => s + v, 0) / medias.length;
      const ultima = medias[0];

      if (ultima < mediaGeral * 0.7) {
        console.log(`[Cron] ⚠ ${row.placa} — Consumo anormal: ${ultima.toFixed(1)} km/L (média: ${mediaGeral.toFixed(1)} km/L)`);
      }
    }
  } catch (err) {
    console.error('[Cron] Erro ao verificar consumo:', err.message || err);
  }
}

async function runAllChecks() {
  try { await checkVencimentos(); } catch (_) {}
  try { await checkManutencaoPreventiva(); } catch (_) {}
  try { await checkAbastecimentoAlertas(); } catch (_) {}
}

function startCron() {
  console.log('[Cron] Iniciando verificações periódicas...');
  runAllChecks();
  intervalId = setInterval(runAllChecks, CHECK_INTERVAL_MS);
}

function stopCron() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[Cron] Verificações periódicas paradas.');
  }
}

module.exports = { startCron, stopCron, runAllChecks };
