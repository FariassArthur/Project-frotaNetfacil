const { verifyAuth } = require('../middleware/auth');
const { all } = require('../database/connection');
const { handleError } = require('../services/errorHandler');

function registerCalendarioRoutes(app) {
  app.get('/api/calendario/eventos', verifyAuth, async (req, res) => {
    try {
      const { start, end, veiculo_id } = req.query;
      if (!start || !end) {
        return res.status(400).json({ error: 'Parâmetros start e end são obrigatórios' });
      }
      const veiculoWhere = veiculo_id ? 'AND veiculo_id = ?' : '';
      const veiculoParams = veiculo_id ? [veiculo_id] : [];
      const events = [];

      // Manutenções
      const manutencoes = await all(`
        SELECT m.id, m.data, m.descricao, m.valor, m.veiculo_id, v.placa AS veiculo_placa
        FROM manutencoes m LEFT JOIN veiculos v ON m.veiculo_id = v.placa
        WHERE m.data BETWEEN ? AND ? ${veiculoWhere}
        ORDER BY m.data
      `, [start, end, ...veiculoParams]);
      for (const m of manutencoes) {
        events.push({
          id: `manut-${m.id}`, title: `Manutenção${m.descricao ? ': ' + m.descricao : ''}`,
          date: m.data, type: 'manutencao', veiculo: m.veiculo_placa || m.veiculo_id,
          valor: m.valor
        });
      }

      // Multas (data_vencimento)
      const multas = await all(`
        SELECT id, data_vencimento, local_ocorrencia, valor, veiculo_id
        FROM multas
        WHERE data_vencimento BETWEEN ? AND ? ${veiculoWhere}
        ORDER BY data_vencimento
      `, [start, end, ...veiculoParams]);
      for (const m of multas) {
        events.push({
          id: `multa-${m.id}`, title: `Multa${m.local_ocorrencia ? ' - ' + m.local_ocorrencia : ''}`,
          date: m.data_vencimento, type: 'multa', veiculo: m.veiculo_id,
          valor: m.valor
        });
      }

      // CNHs (validade)
      const cnhs = await all(`
        SELECT numero_registro, nome, validade FROM cnhs
        WHERE validade BETWEEN ? AND ?
        ORDER BY validade
      `, [start, end]);
      for (const c of cnhs) {
        events.push({
          id: `cnh-${c.numero_registro}`,
          title: `CNH vence: ${c.nome}`,
          date: c.validade, type: 'cnh', veiculo: null, valor: null
        });
      }

      // Contratos de seguro (data_final_contrato)
      const seguros = await all(`
        SELECT cs.id, cs.data_final_contrato, cs.numero_apolice, cs.veiculo_id, v.placa AS veiculo_placa
        FROM contratos_seguro cs LEFT JOIN veiculos v ON cs.veiculo_id = v.placa
        WHERE cs.data_final_contrato BETWEEN ? AND ? ${veiculoWhere}
        ORDER BY cs.data_final_contrato
      `, [start, end, ...veiculoParams]);
      for (const s of seguros) {
        events.push({
          id: `seguro-${s.id}`,
          title: `Seguro vence: Apólice ${s.numero_apolice}`,
          date: s.data_final_contrato, type: 'seguro',
          veiculo: s.veiculo_placa || s.veiculo_id, valor: null
        });
      }

      // Vistorias
      const vistorias = await all(`
        SELECT v.id, v.data, v.status, v.tipo, v.veiculo_id, vei.placa AS veiculo_placa
        FROM vistorias v LEFT JOIN veiculos vei ON v.veiculo_id = vei.placa
        WHERE v.data BETWEEN ? AND ? ${veiculoWhere}
        ORDER BY v.data
      `, [start, end, ...veiculoParams]);
      for (const v of vistorias) {
        events.push({
          id: `vistoria-${v.id}`,
          title: `Vistoria (${v.tipo}): ${v.status}`,
          date: v.data, type: 'vistoria',
          veiculo: v.veiculo_placa || v.veiculo_id, valor: null
        });
      }

      // Abastecimentos
      const abastecimentos = await all(`
        SELECT a.id, a.data, a.valor, a.quantidade, a.veiculo_id, v.placa AS veiculo_placa
        FROM abastecimentos a LEFT JOIN veiculos v ON a.veiculo_id = v.placa
        WHERE a.data BETWEEN ? AND ? ${veiculoWhere}
        ORDER BY a.data
      `, [start, end, ...veiculoParams]);
      for (const a of abastecimentos) {
        events.push({
          id: `abast-${a.id}`,
          title: `Abastecimento: ${a.quantidade}L`,
          date: a.data, type: 'abastecimento',
          veiculo: a.veiculo_placa || a.veiculo_id, valor: a.valor
        });
      }

      // Documentos (pagamento_documentos - data_vencimento)
      const documentos = await all(`
        SELECT pd.id, pd.data_vencimento, pd.descricao, pd.valor, pd.veiculo_id
        FROM pagamento_documentos pd
        WHERE pd.data_vencimento BETWEEN ? AND ? ${veiculoWhere}
        ORDER BY pd.data_vencimento
      `, [start, end, ...veiculoParams]);
      for (const d of documentos) {
        events.push({
          id: `doc-${d.id}`,
          title: `Documento vence${d.descricao ? ': ' + d.descricao : ''}`,
          date: d.data_vencimento, type: 'documento',
          veiculo: d.veiculo_id, valor: d.valor
        });
      }

      // Pagamentos seguro (data_pagamento)
      const pagSeguros = await all(`
        SELECT ps.id, ps.data_pagamento, ps.valor, ps.veiculo_id, v.placa AS veiculo_placa
        FROM pagamentos_seguro ps LEFT JOIN veiculos v ON ps.veiculo_id = v.placa
        WHERE ps.data_pagamento BETWEEN ? AND ? ${veiculoWhere}
        ORDER BY ps.data_pagamento
      `, [start, end, ...veiculoParams]);
      for (const p of pagSeguros) {
        events.push({
          id: `pagseg-${p.id}`,
          title: `Pagamento seguro: R$ ${Number(p.valor).toFixed(2)}`,
          date: p.data_pagamento, type: 'pagamento_seguro',
          veiculo: p.veiculo_placa || p.veiculo_id, valor: p.valor
        });
      }

      events.sort((a, b) => a.date < b.date ? -1 : 1);
      res.json(events);
    } catch (err) {
      handleError(res, err, 'calendario.eventos');
    }
  });
}

module.exports = { registerCalendarioRoutes };
