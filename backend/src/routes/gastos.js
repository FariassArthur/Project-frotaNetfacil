const { openDb, all } = require('../database/connection');

function registerGastosRoutes(app) {
  app.get('/api/gastos/:placa', async (req, res) => {
    const db = openDb();
    const { placa } = req.params;
    const { data_inicio, data_fim } = req.query;
    try {
      const veiculo = await new Promise((resolve, reject) => {
        db.get('SELECT placa, tipo, fipe_name_marca, fipe_modelo, fipe_name_ano FROM veiculos WHERE placa = ?', [placa], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      if (!veiculo) return res.status(404).json({ error: 'Veículo não encontrado' });

      const dateFilter = [];
      const dateParams = [placa];
      if (data_inicio) { dateFilter.push('AND data >= ?'); dateParams.push(data_inicio); }
      if (data_fim) { dateFilter.push('AND data <= ?'); dateParams.push(data_fim + ' 23:59:59'); }
      const dateClause = dateFilter.join(' ');

      const multasDateFilter = [];
      const multasDateParams = [placa];
      if (data_inicio) { multasDateFilter.push('AND data_ocorrencia >= ?'); multasDateParams.push(data_inicio); }
      if (data_fim) { multasDateFilter.push('AND data_ocorrencia <= ?'); multasDateParams.push(data_fim + ' 23:59:59'); }
      const multasDateClause = multasDateFilter.join(' ');

      const pgtoDateFilter = [];
      const pgtoDateParams = [placa];
      if (data_inicio) { pgtoDateFilter.push('AND data_pagamento >= ?'); pgtoDateParams.push(data_inicio); }
      if (data_fim) { pgtoDateFilter.push('AND data_pagamento <= ?'); pgtoDateParams.push(data_fim + ' 23:59:59'); }
      const pgtoDateClause = pgtoDateFilter.join(' ');

      const pgtoDocDateFilter = [];
      const pgtoDocDateParams = [placa];
      if (data_inicio) { pgtoDocDateFilter.push('AND data_pagamento >= ?'); pgtoDocDateParams.push(data_inicio); }
      if (data_fim) { pgtoDocDateFilter.push('AND data_pagamento <= ?'); pgtoDocDateParams.push(data_fim + ' 23:59:59'); }
      const pgtoDocDateClause = pgtoDocDateFilter.join(' ');

      const [manutencoes, multas, abastecimentos, pagamentosSeguro, pagamentoDocumentos] = await Promise.all([
        all(db, `SELECT id, data, valor, descricao, km, classificacao FROM manutencoes WHERE veiculo_id = ? ${dateClause} ORDER BY data`, dateParams),
        all(db, `SELECT id, data_ocorrencia, valor, local_ocorrencia, pagamento_realizado FROM multas WHERE veiculo_id = ? ${multasDateClause} ORDER BY data_ocorrencia`, multasDateParams),
        all(db, `SELECT id, data, valor, quantidade, km FROM abastecimentos WHERE veiculo_id = ? ${dateClause} ORDER BY data`, dateParams),
        all(db, `SELECT id, data_pagamento, valor FROM pagamentos_seguro WHERE veiculo_id = ? ${pgtoDateClause} ORDER BY data_pagamento`, pgtoDateParams),
        all(db, `SELECT id, data_pagamento, valor, descricao FROM pagamento_documentos WHERE veiculo_id = ? ${pgtoDocDateClause} ORDER BY data_pagamento`, pgtoDocDateParams),
      ]);

      const sum = (arr) => arr.reduce((acc, r) => acc + (parseFloat(r.valor) || 0), 0);
      const totalManutencao = sum(manutencoes);
      const totalMultas = sum(multas);
      const totalAbastecimento = sum(abastecimentos);
      const totalSeguro = sum(pagamentosSeguro);
      const totalDocumentos = sum(pagamentoDocumentos);
      const totalGeral = totalManutencao + totalMultas + totalAbastecimento + totalSeguro + totalDocumentos;

      const categorias = [
        { categoria: 'Manutenção', valor: Math.round(totalManutencao * 100) / 100 },
        { categoria: 'Multas', valor: Math.round(totalMultas * 100) / 100 },
        { categoria: 'Abastecimento', valor: Math.round(totalAbastecimento * 100) / 100 },
        { categoria: 'Seguro', valor: Math.round(totalSeguro * 100) / 100 },
        { categoria: 'Documentos', valor: Math.round(totalDocumentos * 100) / 100 },
      ].filter((c) => c.valor > 0);

      res.json({
        veiculo: { placa: veiculo.placa, modelo: veiculo.fipe_modelo || veiculo.tipo || '' },
        periodo: { inicio: data_inicio || null, fim: data_fim || null },
        total: Math.round(totalGeral * 100) / 100,
        categorias,
        detalhes: {
          manutencoes,
          multas,
          abastecimentos,
          pagamentos_seguro: pagamentosSeguro,
          pagamento_documentos: pagamentoDocumentos,
        }
      });
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });

  app.get('/api/gastos', async (req, res) => {
    const db = openDb();
    const { data_inicio, data_fim } = req.query;
    try {
      const veiculos = await new Promise((resolve, reject) => {
        db.all('SELECT placa, fipe_modelo, tipo FROM veiculos ORDER BY placa', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      const dateWhere = [];
      const dateParams = [];
      if (data_inicio) { dateWhere.push('AND m.data >= ?'); dateParams.push(data_inicio); }
      if (data_fim) { dateWhere.push('AND m.data <= ?'); dateParams.push(data_fim + ' 23:59:59'); }
      const dateClause = dateWhere.join(' ');

      const rows = await all(db, `
        SELECT veiculo_id, SUM(valor) as total
        FROM (
          SELECT veiculo_id, valor FROM manutencoes WHERE veiculo_id IS NOT NULL ${dateClause}
          UNION ALL
          SELECT veiculo_id, valor FROM multas WHERE veiculo_id IS NOT NULL ${dateClause}
          UNION ALL
          SELECT veiculo_id, valor FROM abastecimentos WHERE veiculo_id IS NOT NULL ${dateClause}
          UNION ALL
          SELECT veiculo_id, valor FROM pagamentos_seguro WHERE veiculo_id IS NOT NULL ${dateClause}
          UNION ALL
          SELECT veiculo_id, valor FROM pagamento_documentos WHERE veiculo_id IS NOT NULL ${dateClause}
        )
        GROUP BY veiculo_id
        ORDER BY total DESC
      `, dateParams);

      const totais = rows.map((r) => {
        const v = veiculos.find((v) => v.placa === r.veiculo_id);
        return {
          placa: r.veiculo_id,
          modelo: v ? (v.fipe_modelo || v.tipo || '') : '',
          total: Math.round((parseFloat(r.total) || 0) * 100) / 100,
        };
      });

      res.json(totais);
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });
}

module.exports = { registerGastosRoutes };
