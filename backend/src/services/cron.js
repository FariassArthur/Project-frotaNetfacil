const { all, run, sqlDate } = require('../database/connection');

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
let intervalId = null;

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
  await checkManutencaoPreventiva();
  await checkAbastecimentoAlertas();
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
