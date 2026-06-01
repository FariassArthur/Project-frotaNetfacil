const { all, get } = require('../database/connection');
const { handleError } = require('../services/errorHandler');

function registerGastosRoutes(app) {
  app.get('/api/gastos/:placa', async (req, res) => {
    const { placa } = req.params;
    const { data_inicio, data_fim } = req.query;
    try {
      const veiculo = await get('SELECT placa, tipo, fipe_name_marca, fipe_modelo, fipe_name_ano FROM veiculos WHERE placa = ?', [placa]);
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
        all(`SELECT id, data, valor, descricao, km, classificacao FROM manutencoes WHERE veiculo_id = ? ${dateClause} ORDER BY data`, dateParams),
        all(`SELECT id, data_ocorrencia, valor, local_ocorrencia, pagamento_realizado, motorista_id FROM multas WHERE veiculo_id = ? ${multasDateClause} ORDER BY data_ocorrencia`, multasDateParams),
        all(`SELECT id, data, valor, quantidade, km FROM abastecimentos WHERE veiculo_id = ? ${dateClause} ORDER BY data`, dateParams),
        all(`SELECT id, data_pagamento, valor FROM pagamentos_seguro WHERE veiculo_id = ? ${pgtoDateClause} ORDER BY data_pagamento`, pgtoDateParams),
        all(`SELECT id, data_pagamento, valor, descricao FROM pagamento_documentos WHERE veiculo_id = ? ${pgtoDocDateClause} ORDER BY data_pagamento`, pgtoDocDateParams),
      ]);

      const consumo = [];
      const tanqueCheio = abastecimentos.filter(a => a.tanque_cheio == 1);
      const absSource = tanqueCheio.length >= 2 ? tanqueCheio : abastecimentos;
      if (absSource.length >= 2) {
        for (let i = 1; i < absSource.length; i++) {
          const atual = absSource[i];
          const anterior = absSource[i - 1];
          if (atual.km != null && anterior.km != null && atual.quantidade > 0) {
            const kmRodados = atual.km - anterior.km;
            if (kmRodados > 0) {
              consumo.push({
                data: atual.data,
                km_rodados: kmRodados,
                litros: atual.quantidade,
                km_por_litro: Math.round((kmRodados / atual.quantidade) * 100) / 100,
                tanque_cheio: atual.tanque_cheio == 1,
              });
            }
          }
        }
      }
      const consumoMedio = consumo.length > 0
        ? Math.round((consumo.reduce((s, c) => s + c.km_por_litro, 0) / consumo.length) * 100) / 100
        : null;

      const anomalias = consumo.filter(c => consumoMedio != null && c.km_por_litro < consumoMedio * 0.7).map(c => ({
        ...c,
        desvio: Math.round((1 - c.km_por_litro / consumoMedio) * 100),
      }));

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
        consumo: {
          detalhes: consumo,
          media_km_por_litro: consumoMedio,
          anomalias,
          usando_tanque_cheio: tanqueCheio.length >= 2,
        },
        detalhes: {
          manutencoes,
          multas,
          abastecimentos,
          pagamentos_seguro: pagamentosSeguro,
          pagamento_documentos: pagamentoDocumentos,
        }
      });
    } catch (error) {
      handleError(res, error, 'gastos');
    }
  });

  app.get('/api/gastos', async (req, res) => {
    const { data_inicio, data_fim } = req.query;
    try {
      const veiculos = await all('SELECT placa, fipe_modelo, tipo FROM veiculos ORDER BY placa');

      const dateWhere = [];
      const dateParams = [];
      if (data_inicio) { dateWhere.push('AND m.data >= ?'); dateParams.push(data_inicio); }
      if (data_fim) { dateWhere.push('AND m.data <= ?'); dateParams.push(data_fim + ' 23:59:59'); }
      const dateClause = dateWhere.join(' ');

      const rows = await all(`
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
      handleError(res, error, 'gastos');
    }
  });
}

module.exports = { registerGastosRoutes };
