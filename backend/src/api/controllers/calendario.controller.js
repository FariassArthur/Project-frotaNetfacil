const { sequelize } = require('../../database/sequelize');
const { handleError } = require('../../services/errorHandler');
const { parseDateToISO } = require('../utils/helpers');

async function fetchEvents(query, replacements, mapFn) {
  const rows = await sequelize.query(query, { replacements, type: sequelize.QueryTypes.SELECT });
  return rows.map(mapFn);
}

async function eventos(req, res) {
  try {
    const { start, end, veiculo_id } = req.query;
    if (!start || !end) return res.status(400).json({ error: 'Parâmetros start e end são obrigatórios' });

    const validStart = parseDateToISO(start);
    const validEnd = parseDateToISO(end);
    if (!validStart || !validEnd) {
      return res.status(400).json({ error: 'Formato de data inválido. Use AAAA-MM-DD ou DD/MM/AAAA' });
    }

    const vw = veiculo_id ? 'AND veiculo_id = ?' : '';
    const vp = veiculo_id ? [veiculo_id] : [];
    const base = [validStart, validEnd, ...vp];

    const [manutencoes, multas, cnhs, seguros, vistorias, abastecimentos, documentos, pagSeguros] = await Promise.all([
      fetchEvents(
        `SELECT m.id, m.data, m.descricao, m.valor, m.veiculo_id, v.placa AS veiculo_placa
         FROM manutencoes m LEFT JOIN veiculos v ON m.veiculo_id = v.placa
         WHERE m.data BETWEEN ? AND ? ${vw} ORDER BY m.data`,
        base,
        (m) => ({ id: `manut-${m.id}`, title: `Manutenção${m.descricao ? ': ' + m.descricao : ''}`, date: m.data, type: 'manutencao', veiculo: m.veiculo_placa || m.veiculo_id, valor: m.valor })
      ),
      fetchEvents(
        `SELECT id, data_vencimento, local_ocorrencia, valor, veiculo_id
         FROM multas WHERE data_vencimento BETWEEN ? AND ? ${vw} ORDER BY data_vencimento`,
        base,
        (m) => ({ id: `multa-${m.id}`, title: `Multa${m.local_ocorrencia ? ' - ' + m.local_ocorrencia : ''}`, date: m.data_vencimento, type: 'multa', veiculo: m.veiculo_id, valor: m.valor })
      ),
      fetchEvents(
        `SELECT numero_registro, nome, validade
         FROM cnhs WHERE validade BETWEEN ? AND ? ORDER BY validade`,
        [validStart, validEnd],
        (c) => ({ id: `cnh-${c.numero_registro}`, title: `CNH vence: ${c.nome}`, date: c.validade, type: 'cnh', veiculo: null, valor: null })
      ),
      fetchEvents(
        `SELECT cs.id, cs.data_final_contrato, cs.numero_apolice, cs.veiculo_id, v.placa AS veiculo_placa
         FROM contratos_seguro cs LEFT JOIN veiculos v ON cs.veiculo_id = v.placa
         WHERE cs.data_final_contrato BETWEEN ? AND ? ${vw} ORDER BY cs.data_final_contrato`,
        base,
        (s) => ({ id: `seguro-${s.id}`, title: `Seguro vence: Apólice ${s.numero_apolice}`, date: s.data_final_contrato, type: 'seguro', veiculo: s.veiculo_placa || s.veiculo_id, valor: null })
      ),
      fetchEvents(
        `SELECT v.id, v.data, v.status, v.tipo, v.veiculo_id, vei.placa AS veiculo_placa
         FROM vistorias v LEFT JOIN veiculos vei ON v.veiculo_id = vei.placa
         WHERE v.data BETWEEN ? AND ? ${vw} ORDER BY v.data`,
        base,
        (v) => ({ id: `vistoria-${v.id}`, title: `Vistoria (${v.tipo}): ${v.status}`, date: v.data, type: 'vistoria', veiculo: v.veiculo_placa || v.veiculo_id, valor: null })
      ),
      fetchEvents(
        `SELECT a.id, a.data, a.valor, a.quantidade, a.veiculo_id, v.placa AS veiculo_placa
         FROM abastecimentos a LEFT JOIN veiculos v ON a.veiculo_id = v.placa
         WHERE a.data BETWEEN ? AND ? ${vw} ORDER BY a.data`,
        base,
        (a) => ({ id: `abast-${a.id}`, title: `Abastecimento: ${a.quantidade}L`, date: a.data, type: 'abastecimento', veiculo: a.veiculo_placa || a.veiculo_id, valor: a.valor })
      ),
      fetchEvents(
        `SELECT pd.id, pd.data_vencimento, pd.descricao, pd.valor, pd.veiculo_id
         FROM pagamento_documentos pd WHERE pd.data_vencimento BETWEEN ? AND ? ${vw} ORDER BY pd.data_vencimento`,
        base,
        (d) => ({ id: `doc-${d.id}`, title: `Documento vence${d.descricao ? ': ' + d.descricao : ''}`, date: d.data_vencimento, type: 'documento', veiculo: d.veiculo_id, valor: d.valor })
      ),
      fetchEvents(
        `SELECT ps.id, ps.data_pagamento, ps.valor, ps.veiculo_id, v.placa AS veiculo_placa
         FROM pagamentos_seguro ps LEFT JOIN veiculos v ON ps.veiculo_id = v.placa
         WHERE ps.data_pagamento BETWEEN ? AND ? ${vw} ORDER BY ps.data_pagamento`,
        base,
        (p) => ({ id: `pagseg-${p.id}`, title: `Pagamento seguro: R$ ${Number(p.valor).toFixed(2)}`, date: p.data_pagamento, type: 'pagamento_seguro', veiculo: p.veiculo_placa || p.veiculo_id, valor: p.valor })
      ),
    ]);

    const events = [...manutencoes, ...multas, ...cnhs, ...seguros, ...vistorias, ...abastecimentos, ...documentos, ...pagSeguros];
    events.sort((a, b) => a.date < b.date ? -1 : 1);
    res.json(events);
  } catch (err) { handleError(res, err, 'calendario.eventos'); }
}

module.exports = { eventos };
