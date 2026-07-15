const { sequelize } = require('../../database/sequelize');
const { OrdemServico } = require('../../database/models');
const { handleError } = require('../../services/errorHandler');

const ALLOWED_TABLES = {
  veiculos: true, cnhs: true, mecanicas: true, manutencoes: true,
  multas: true, seguradoras: true, contratos_seguro: true,
  pagamentos_seguro: true, pagamento_documentos: true,
  abastecimentos: true, higienizacao: true, combustiveis: true,
  tipo_manutencao: true, cidades: true, viagens: true,
};

const TABLES = [
  { key: 'veiculos', label: 'Veículos' }, { key: 'cnhs', label: 'CNHs' },
  { key: 'mecanicas', label: 'Mecânicas' }, { key: 'manutencoes', label: 'Manutenções' },
  { key: 'multas', label: 'Multas' }, { key: 'seguradoras', label: 'Seguradoras' },
  { key: 'contratos_seguro', label: 'Contratos Seguro' }, { key: 'pagamentos_seguro', label: 'Pagamentos Seguro' },
  { key: 'pagamento_documentos', label: 'Pagamentos Documento' }, { key: 'abastecimentos', label: 'Abastecimentos' },
  { key: 'higienizacao', label: 'Higienização' }, { key: 'cidades', label: 'Cidades' },
  { key: 'combustiveis', label: 'Combustíveis' }, { key: 'tipo_manutencao', label: 'Tipos Manutenção' },
  { key: 'viagens', label: 'Viagens' },
];

async function graficos(req, res) {
  try {
    const year = parseInt(req.query.ano, 10) || new Date().getFullYear();
    const veiculoFilter = req.query.veiculo_id || '';
    const meses = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    const gastoMes = (tabela, campoData) => {
      const params = [`${year}-%`];
      if (veiculoFilter) params.push(veiculoFilter);
      return sequelize.query(`SELECT substr(${campoData}, 6, 2) as mes, COALESCE(SUM(valor), 0) as total FROM ${tabela} WHERE ${campoData} LIKE ?${veiculoFilter ? ' AND veiculo_id = ?' : ''} GROUP BY mes ORDER BY mes`, { replacements: params, type: sequelize.QueryTypes.SELECT });
    };
    const baseParams = [`${year}-%`];
    if (veiculoFilter) baseParams.push(veiculoFilter);
    const veiculoWhere = veiculoFilter ? ' AND veiculo_id = ?' : '';
    const [manutencao, combustivel, multas, seguroDocs, kmlRows] = await Promise.all([
      gastoMes('manutencoes', 'data'), gastoMes('abastecimentos', 'data'), gastoMes('multas', 'data_ocorrencia'),
      sequelize.query("SELECT 'seguro' as tipo, substr(p.data_pagamento, 6, 2) as mes, COALESCE(SUM(p.valor), 0) as total FROM pagamentos_seguro p WHERE p.data_pagamento LIKE ?" + veiculoWhere + " GROUP BY mes UNION ALL SELECT 'documento' as tipo, substr(d.data_pagamento, 6, 2) as mes, COALESCE(SUM(d.valor), 0) as total FROM pagamento_documentos d WHERE d.data_pagamento LIKE ?" + veiculoWhere + ' GROUP BY mes', { replacements: [...baseParams, ...baseParams], type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT substr(a.data, 6, 2) as mes, AVG(CASE WHEN a.km > 0 THEN a.km / a.quantidade ELSE NULL END) as media_km_l FROM abastecimentos a WHERE a.data LIKE ? AND a.km > 0 AND a.quantidade > 0' + veiculoWhere + ' GROUP BY mes ORDER BY mes', { replacements: [...baseParams], type: sequelize.QueryTypes.SELECT }),
    ]);
    const toMap = (rows) => { const m = {}; for (const r of rows) m[r.mes] = r.total; return m; };
    const manutMap = toMap(manutencao); const combMap = toMap(combustivel); const multaMap = toMap(multas);
    const segMap = {}; for (const r of seguroDocs) segMap[r.mes] = (segMap[r.mes] || 0) + Number(r.total);
    const kmlMap = {}; for (const r of kmlRows) kmlMap[r.mes] = r.media_km_l;
    const gastos = meses.map(mes => ({
      mes, manutencao: Number(manutMap[mes] || 0), combustivel: Number(combMap[mes] || 0),
      multas: Number(multaMap[mes] || 0), seguros: Number(segMap[mes] || 0),
      km_l: kmlMap[mes] ? Number(Number(kmlMap[mes]).toFixed(2)) : null,
    }));
    res.json({ gastos });
  } catch (error) { handleError(res, error, 'dashboard.graficos'); }
}

async function relatorioCustos(req, res) {
  try {
    const rows = await sequelize.query(`
      SELECT v.placa, v.fipe_modelo,
        COALESCE((SELECT COALESCE(SUM(m.valor), 0) FROM manutencoes m WHERE m.veiculo_id = v.placa), 0) as total_manutencao,
        COALESCE((SELECT COALESCE(SUM(a.valor), 0) FROM abastecimentos a WHERE a.veiculo_id = v.placa), 0) as total_combustivel,
        COALESCE((SELECT COALESCE(SUM(m2.valor), 0) FROM multas m2 WHERE m2.veiculo_id = v.placa), 0) as total_multas,
        COALESCE((SELECT COALESCE(SUM(ps.valor), 0) FROM pagamentos_seguro ps WHERE ps.veiculo_id = v.placa), 0) as total_seguro,
        COALESCE((SELECT COALESCE(SUM(h.valor), 0) FROM higienizacao h WHERE h.veiculo_id = v.placa), 0) as total_higienizacao,
        COALESCE((SELECT COALESCE(SUM(COALESCE(os.valor_mao_obra, 0)+COALESCE(os.valor_pecas, 0)), 0) FROM ordens_servico os WHERE os.veiculo_id = v.placa), 0) as total_os,
        (SELECT COUNT(*) FROM viagens vg WHERE vg.veiculo_id = v.placa) as total_viagens
      FROM veiculos v WHERE v.ativo = 1 OR v.ativo IS NULL ORDER BY v.placa
    `, { type: sequelize.QueryTypes.SELECT });
    const result = rows.map(r => ({
      ...r, total_manutencao: Number(r.total_manutencao), total_combustivel: Number(r.total_combustivel),
      total_multas: Number(r.total_multas), total_seguro: Number(r.total_seguro),
      total_higienizacao: Number(r.total_higienizacao), total_os: Number(r.total_os),
      total_viagens: Number(r.total_viagens),
      total_geral: Number(r.total_manutencao)+Number(r.total_combustivel)+Number(r.total_multas)+Number(r.total_seguro)+Number(r.total_higienizacao)+Number(r.total_os),
    }));
    res.json(result);
  } catch (error) { handleError(res, error, 'dashboard.relatorio-custos'); }
}

async function dashboard(req, res) {
  try {
    const result = {};
    const limit = Math.min(500, parseInt(req.query._limit, 10) || 200);
    const validTables = TABLES.filter(t => ALLOWED_TABLES[t.key]);
    const countQuery = validTables.map(t => `SELECT '${t.key}' as tbl, COUNT(*) as cnt FROM ${t.key}`).join(' UNION ALL ');
    const countRows = await sequelize.query(countQuery, { type: sequelize.QueryTypes.SELECT });
    const countMap = {};
    for (const r of countRows) countMap[r.tbl] = Number(r.cnt);
    const rowQueries = validTables.map(t =>
      sequelize.query(`SELECT * FROM ${t.key} ORDER BY 1 LIMIT ?`, { replacements: [limit], type: sequelize.QueryTypes.SELECT })
        .then(rows => ({ key: t.key, label: t.label, rows }))
    );
    const rowResults = await Promise.all(rowQueries);
    for (const { key, label, rows } of rowResults) {
      result[key] = { label, count: countMap[key] || 0, rows, columns: rows.length > 0 ? Object.keys(rows[0]) : [] };
    }
    res.json(result);
  } catch (error) { handleError(res, error, 'dashboard'); }
}

async function notificacoes(req, res) {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const daqui30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const [cnhExpiradas, cnhExpiram, seguroExpirados, seguroExpiram, ipvaExpirados, ipvaExpiram, multasVencidas, docsVencidos, preventivas, preventivasProximas] = await Promise.all([
      sequelize.query('SELECT numero_registro, nome, validade FROM cnhs WHERE validade IS NOT NULL AND validade < ?', { replacements: [hoje], type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT numero_registro, nome, validade FROM cnhs WHERE validade >= ? AND validade <= ?', { replacements: [hoje, daqui30], type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT cs.id, cs.data_final_contrato, cs.numero_apolice, cs.veiculo_id, v.placa FROM contratos_seguro cs LEFT JOIN veiculos v ON cs.veiculo_id = v.placa WHERE cs.ativo = 1 AND cs.data_final_contrato IS NOT NULL AND cs.data_final_contrato < ?', { replacements: [hoje], type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT cs.id, cs.data_final_contrato, cs.numero_apolice, cs.veiculo_id, v.placa FROM contratos_seguro cs LEFT JOIN veiculos v ON cs.veiculo_id = v.placa WHERE cs.ativo = 1 AND cs.data_final_contrato >= ? AND cs.data_final_contrato <= ?', { replacements: [hoje, daqui30], type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT placa, data_vencimento_ipva FROM veiculos WHERE data_vencimento_ipva IS NOT NULL AND data_vencimento_ipva < ?', { replacements: [hoje], type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT placa, data_vencimento_ipva FROM veiculos WHERE data_vencimento_ipva IS NOT NULL AND data_vencimento_ipva >= ? AND data_vencimento_ipva <= ?', { replacements: [hoje, daqui30], type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT id, veiculo_id, local_ocorrencia, valor, data_vencimento FROM multas WHERE data_vencimento IS NOT NULL AND data_vencimento < ? AND (pagamento_realizado IS NULL OR pagamento_realizado = 0)', { replacements: [hoje], type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT id, veiculo_id, descricao, valor, data_vencimento FROM pagamento_documentos WHERE data_vencimento IS NOT NULL AND data_vencimento < ? AND data_pagamento IS NULL', { replacements: [hoje], type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT c.id, c.descricao, c.km_proxima, c.data_proxima, v.placa, v.km as km_atual FROM config_manutencao_preventiva c JOIN veiculos v ON c.veiculo_id = v.placa WHERE c.ativo = 1 AND ((c.km_proxima IS NOT NULL AND v.km >= c.km_proxima) OR (c.data_proxima IS NOT NULL AND c.data_proxima <= ?))', { replacements: [hoje], type: sequelize.QueryTypes.SELECT }),
      sequelize.query("SELECT c.id, c.descricao, c.km_proxima, c.km_intervalo, c.data_proxima, v.placa, v.km as km_atual FROM config_manutencao_preventiva c JOIN veiculos v ON c.veiculo_id = v.placa WHERE c.ativo = 1 AND ((c.km_proxima IS NOT NULL AND v.km >= (c.km_proxima - c.km_intervalo * 0.1) AND v.km < c.km_proxima) OR (c.data_proxima IS NOT NULL AND c.data_proxima > ? AND c.data_proxima <= date(?, '+7 days')))", { replacements: [hoje, hoje], type: sequelize.QueryTypes.SELECT }),
    ]);
    const daysDiff = (d) => Math.floor((new Date(hoje) - new Date(d)) / (1000 * 60 * 60 * 24));
    const cnhExpiradasItems = cnhExpiradas.map(c => ({ tipo: 'CNH', id: `cnh-${c.numero_registro}`, titulo: c.nome, descricao: `CNH vencida em ${c.validade}`, data: c.validade, veiculo_id: null, valor: null, dias_atraso: daysDiff(c.validade) }));
    const cnhExpiramItems = cnhExpiram.map(c => ({ tipo: 'CNH', id: `cnh-prox-${c.numero_registro}`, titulo: c.nome, descricao: `CNH vence em ${c.validade}`, data: c.validade, veiculo_id: null, valor: null, dias_atraso: 0 }));
    const seguroExpiradosItems = seguroExpirados.map(s => ({ tipo: 'Seguro', id: `seg-${s.id}`, titulo: `Apólice ${s.numero_apolice}`, descricao: `Seguro vencido em ${s.data_final_contrato}`, data: s.data_final_contrato, veiculo_id: s.placa || s.veiculo_id, valor: null, dias_atraso: daysDiff(s.data_final_contrato) }));
    const seguroExpiramItems = seguroExpiram.map(s => ({ tipo: 'Seguro', id: `seg-prox-${s.id}`, titulo: `Apólice ${s.numero_apolice}`, descricao: `Seguro vence em ${s.data_final_contrato}`, data: s.data_final_contrato, veiculo_id: s.placa || s.veiculo_id, valor: null, dias_atraso: 0 }));
    const ipvaExpiradosItems = ipvaExpirados.map(v => ({ tipo: 'IPVA', id: `ipva-${v.placa}`, titulo: v.placa, descricao: `IPVA vencido em ${v.data_vencimento_ipva}`, data: v.data_vencimento_ipva, veiculo_id: v.placa, valor: null, dias_atraso: daysDiff(v.data_vencimento_ipva) }));
    const ipvaExpiramItems = ipvaExpiram.map(v => ({ tipo: 'IPVA', id: `ipva-prox-${v.placa}`, titulo: v.placa, descricao: `IPVA vence em ${v.data_vencimento_ipva}`, data: v.data_vencimento_ipva, veiculo_id: v.placa, valor: null, dias_atraso: 0 }));
    const multasItems = multasVencidas.map(m => ({ tipo: 'Multa', id: `multa-${m.id}`, titulo: m.local_ocorrencia || 'Multa', descricao: `Multa vencida em ${m.data_vencimento}`, data: m.data_vencimento, veiculo_id: m.veiculo_id, valor: m.valor, dias_atraso: daysDiff(m.data_vencimento) }));
    const docItems = docsVencidos.map(d => ({ tipo: 'Documento', id: `doc-${d.id}`, titulo: d.descricao || 'Documento', descricao: `Documento vencido em ${d.data_vencimento}`, data: d.data_vencimento, veiculo_id: d.veiculo_id, valor: d.valor, dias_atraso: daysDiff(d.data_vencimento) }));
    const preventivaItems = preventivas.map(p => ({ tipo: 'Preventiva', id: `prev-${p.id}`, titulo: p.placa, descricao: `${p.descricao}${p.km_proxima ? ` — KM ${p.km_proxima} (atual: ${p.km_atual})` : ''}${p.data_proxima ? ` — Data: ${p.data_proxima}` : ''}`, data: p.data_proxima || hoje, veiculo_id: p.placa, valor: null, dias_atraso: 0 }));
    const preventivasProxItems = preventivasProximas.map(p => ({ tipo: 'Preventiva', id: `prev-prox-${p.id}`, titulo: p.placa, descricao: `${p.descricao} — Falta ${p.km_proxima ? `${(p.km_proxima - p.km_atual).toLocaleString()} KM` : ''}${p.data_proxima ? ` (até ${p.data_proxima})` : ''}`, data: p.data_proxima || hoje, veiculo_id: p.placa, valor: null, dias_atraso: 0 }));
    const todos = [...multasItems, ...docItems, ...preventivaItems];
    const vencendo = [...cnhExpiramItems, ...seguroExpiramItems, ...ipvaExpiramItems, ...preventivasProxItems];
    res.json({
      atrasados: todos, expirados: { cnh: cnhExpiradasItems, seguro: seguroExpiradosItems, ipva: ipvaExpiradosItems }, vencendo,
      totais: { atrasados: todos.length, cnh_expiradas: cnhExpiradasItems.length, cnh_expiram: cnhExpiramItems.length, seguro_expirados: seguroExpiradosItems.length, ipva_expirados: ipvaExpiradosItems.length, preventiva_atrasadas: preventivaItems.length, preventiva_proximas: preventivasProxItems.length },
    });
  } catch (error) { handleError(res, error, 'dashboard.notificacoes'); }
}

async function pagamentos(req, res) {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const [multas, documentos] = await Promise.all([
      sequelize.query("SELECT m.id, 'Multa' AS tipo, m.veiculo_id, m.local_ocorrencia AS descricao, m.valor, m.data_vencimento, m.pagamento_realizado, m.motorista_id, c.nome AS motorista_nome FROM multas m LEFT JOIN cnhs c ON m.motorista_id = c.numero_registro WHERE m.data_vencimento IS NOT NULL", { type: sequelize.QueryTypes.SELECT }),
      sequelize.query("SELECT id, 'Documento' AS tipo, veiculo_id, descricao, valor, data_vencimento, data_pagamento FROM pagamento_documentos WHERE data_vencimento IS NOT NULL", { type: sequelize.QueryTypes.SELECT }),
    ]);
    const noPrazo = { multas: 0, documentos: 0 }; const emAtraso = { multas: 0, documentos: 0 }; const atrasados = []; const noPrazoList = [];
    const classify = (item, pago) => {
      const venc = item.data_vencimento; if (!venc) return;
      if (pago) { noPrazo[item.tipo === 'Multa' ? 'multas' : 'documentos']++; noPrazoList.push({ ...item, situacao: 'Pago', data_vencimento: venc }); return; }
      if (venc < hoje) { emAtraso[item.tipo === 'Multa' ? 'multas' : 'documentos']++; atrasados.push({ ...item, dias_atraso: Math.floor((new Date(hoje) - new Date(venc)) / (1000 * 60 * 60 * 24)), data_vencimento: venc }); }
      else { noPrazo[item.tipo === 'Multa' ? 'multas' : 'documentos']++; noPrazoList.push({ ...item, situacao: 'A vencer', data_vencimento: venc }); }
    };
    for (const m of multas) classify(m, m.pagamento_realizado == 1);
    for (const d of documentos) classify(d, d.data_pagamento != null);
    res.json({ noPrazo: { total: noPrazo.multas + noPrazo.documentos, ...noPrazo }, emAtraso: { total: emAtraso.multas + emAtraso.documentos, ...emAtraso }, atrasados, noPrazoList });
  } catch (error) { handleError(res, error, 'dashboard.pagamentos'); }
}

async function custoKm(req, res) {
  try {
    const rows = await sequelize.query(`
      SELECT v.placa, v.fipe_modelo, v.km as km_atual,
        COALESCE((SELECT SUM(m.valor) FROM manutencoes m WHERE m.veiculo_id = v.placa), 0) as total_manutencao,
        COALESCE((SELECT SUM(a.valor) FROM abastecimentos a WHERE a.veiculo_id = v.placa), 0) as total_combustivel,
        COALESCE((SELECT SUM(m2.valor) FROM multas m2 WHERE m2.veiculo_id = v.placa), 0) as total_multas,
        COALESCE((SELECT SUM(ps.valor) FROM pagamentos_seguro ps WHERE ps.veiculo_id = v.placa), 0) as total_seguro,
        COALESCE((SELECT SUM(h.valor) FROM higienizacao h WHERE h.veiculo_id = v.placa), 0) as total_higienizacao,
        COALESCE((SELECT SUM(COALESCE(os.valor_mao_obra,0)+COALESCE(os.valor_pecas,0)) FROM ordens_servico os WHERE os.veiculo_id = v.placa), 0) as total_os
      FROM veiculos v WHERE v.km > 0 ORDER BY v.placa
    `, { type: sequelize.QueryTypes.SELECT });
    const result = rows.map(r => {
      const total = Number(r.total_manutencao)+Number(r.total_combustivel)+Number(r.total_multas)+Number(r.total_seguro)+Number(r.total_higienizacao)+Number(r.total_os);
      return { placa: r.placa, modelo: r.fipe_modelo, km_atual: r.km_atual, total_manutencao: Number(r.total_manutencao), total_combustivel: Number(r.total_combustivel), total_multas: Number(r.total_multas), total_seguro: Number(r.total_seguro), total_higienizacao: Number(r.total_higienizacao), total_os: Number(r.total_os), total_geral: total, custo_por_km: Number((total / r.km_atual).toFixed(4)) };
    });
    res.json(result);
  } catch (error) { handleError(res, error, 'dashboard.custo-km'); }
}

async function consumo(req, res) {
  try {
    const rows = await sequelize.query(`
      SELECT a.veiculo_id, v.placa, v.fipe_modelo, COUNT(a.id) as total_abastecimentos,
        COALESCE(SUM(a.quantidade), 0) as total_litros, COALESCE(SUM(a.valor), 0) as total_gasto,
        MAX(a.km) as km_atual, MIN(CASE WHEN a.km > 0 THEN a.km END) as km_min
      FROM abastecimentos a JOIN veiculos v ON a.veiculo_id = v.placa
      WHERE a.quantidade > 0 AND a.km > 0
      GROUP BY a.veiculo_id HAVING total_abastecimentos >= 2 ORDER BY total_litros DESC
    `, { type: sequelize.QueryTypes.SELECT });
    const veiculoIds = rows.map(r => r.veiculo_id);
    let consumoMap = {};
    if (veiculoIds.length > 0) {
      const placeholders = veiculoIds.map(() => '?').join(',');
      const lastTwo = await sequelize.query(`
        SELECT veiculo_id, km, quantidade, data,
          ROW_NUMBER() OVER (PARTITION BY veiculo_id ORDER BY data DESC) as rn
        FROM abastecimentos WHERE veiculo_id IN (${placeholders}) AND km IS NOT NULL AND quantidade > 0
      `, { replacements: veiculoIds, type: sequelize.QueryTypes.SELECT });
      const byVeiculo = {};
      for (const r of lastTwo) {
        if (!byVeiculo[r.veiculo_id]) byVeiculo[r.veiculo_id] = [];
        if (byVeiculo[r.veiculo_id].length < 2) byVeiculo[r.veiculo_id].push(r);
      }
      for (const [vid, items] of Object.entries(byVeiculo)) {
        if (items.length >= 2) {
          const diffKm = items[0].km - items[1].km;
          if (diffKm > 0) consumoMap[vid] = diffKm / items[0].quantidade;
        }
      }
    }
    const result = rows.map(r => {
      let kml = consumoMap[r.veiculo_id] || null;
      if (!kml && r.total_litros > 0 && r.km_atual > 0 && r.km_min) {
        kml = (r.km_atual - r.km_min) / r.total_litros;
      }
      return { placa: r.placa, modelo: r.fipe_modelo, total_abastecimentos: r.total_abastecimentos, total_litros: Number(r.total_litros.toFixed(1)), total_gasto: Number(r.total_gasto.toFixed(2)), km_atual: r.km_atual, km_l: kml ? Number(kml.toFixed(2)) : null, custo_por_litro: r.total_litros > 0 ? Number((r.total_gasto / r.total_litros).toFixed(2)) : 0 };
    });
    res.json(result);
  } catch (error) { handleError(res, error, 'dashboard.consumo'); }
}

async function pneus(req, res) {
  try {
    const stats = await sequelize.query(`
      SELECT p.veiculo_id, v.placa, v.fipe_modelo, COUNT(p.id) as total_pneus,
        SUM(CASE WHEN p.status = 'instalado' THEN 1 ELSE 0 END) as instalados,
        SUM(CASE WHEN p.status = 'retirado' THEN 1 ELSE 0 END) as retirados,
        SUM(CASE WHEN p.status = 'estoque' THEN 1 ELSE 0 END) as em_estoque,
        COALESCE(SUM(p.valor), 0) as total_gasto,
        AVG(CASE WHEN p.km_retirada IS NOT NULL AND p.km_instalacao IS NOT NULL THEN (p.km_retirada - p.km_instalacao) ELSE NULL END) as km_medio
      FROM pneus p LEFT JOIN veiculos v ON p.veiculo_id = v.placa
      GROUP BY p.veiculo_id ORDER BY total_gasto DESC
    `, { type: sequelize.QueryTypes.SELECT });
    res.json(stats);
  } catch (error) { handleError(res, error, 'dashboard.pneus'); }
}

async function ordensServicoStats(req, res) {
  try {
    const rows = await OrdemServico.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('*')), 'total']],
      group: ['status'], raw: true,
    });
    const map = { aberta: 0, em_andamento: 0, concluida: 0, cancelada: 0 };
    for (const r of rows) map[r.status] = r.total;
    res.json(map);
  } catch (error) { handleError(res, error, 'dashboard.ordens-servico'); }
}

module.exports = { graficos, relatorioCustos, dashboard, notificacoes, pagamentos, custoKm, consumo, pneus, ordensServicoStats };
