const { sequelize } = require('../../database/sequelize');
const { handleError } = require('../../services/errorHandler');
const { buildDateFilter, calculateKmPerLiter } = require('../utils/helpers');

function buildDateClause(columnName, dataInicio, dataFim, params) {
  const conditions = [];
  if (dataInicio) {
    params.push(dataInicio);
    conditions.push(`AND ${columnName} >= $${params.length}`);
  }
  if (dataFim) {
    params.push(dataFim);
    conditions.push(`AND ${columnName} <= $${params.length}`);
  }
  return conditions.join(' ');
}

async function byPlaca(req, res) {
  const { placa } = req.params;
  const { data_inicio, data_fim } = req.query;
  try {
    const veiculoRows = await sequelize.query(
      'SELECT placa, tipo, fipe_name_marca, fipe_modelo, fipe_name_ano FROM veiculos WHERE placa = $1',
      { bind: [placa], type: sequelize.QueryTypes.SELECT }
    );
    const veiculo = veiculoRows[0];
    if (!veiculo) return res.status(404).json({ error: 'Veículo não encontrado' });

    const manutParams = [placa];
    const manutDateClause = buildDateClause('data', data_inicio, data_fim, manutParams);
    const multasParams = [placa];
    const multasDateClause = buildDateClause('data_ocorrencia', data_inicio, data_fim, multasParams);
    const pgtoParams = [placa];
    const pgtoDateClause = buildDateClause('data_pagamento', data_inicio, data_fim, pgtoParams);

    const [manutencoes, multas, abastecimentos, pagamentosSeguro, pagamentoDocumentos] = await Promise.all([
      sequelize.query(`SELECT id, data, valor, descricao, km, classificacao FROM manutencoes WHERE veiculo_id = $1 ${manutDateClause} ORDER BY data`, { bind: manutParams, type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`SELECT id, data_ocorrencia, valor, local_ocorrencia, pagamento_realizado, motorista_id FROM multas WHERE veiculo_id = $1 ${multasDateClause} ORDER BY data_ocorrencia`, { bind: multasParams, type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`SELECT id, data, valor, quantidade, km, tanque_cheio FROM abastecimentos WHERE veiculo_id = $1 ${manutDateClause} ORDER BY data`, { bind: manutParams, type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`SELECT id, data_pagamento, valor FROM pagamentos_seguro WHERE veiculo_id = $1 ${pgtoDateClause} ORDER BY data_pagamento`, { bind: pgtoParams, type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`SELECT id, data_pagamento, valor, descricao FROM pagamento_documentos WHERE veiculo_id = $1 ${pgtoDateClause} ORDER BY data_pagamento`, { bind: pgtoParams, type: sequelize.QueryTypes.SELECT }),
    ]);

    const consumo = [];
    const tanqueCheio = abastecimentos.filter(a => a.tanque_cheio === true);
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
              km_por_litro: calculateKmPerLiter(kmRodados, atual.quantidade),
              tanque_cheio: atual.tanque_cheio === true,
            });
          }
        }
      }
    }
    const consumoMedio = consumo.length > 0 ? Math.round((consumo.reduce((s, c) => s + c.km_por_litro, 0) / consumo.length) * 100) / 100 : null;
    const anomalias = consumo.filter(c => consumoMedio != null && c.km_por_litro < consumoMedio * 0.7).map(c => ({ ...c, desvio: Math.round((1 - c.km_por_litro / consumoMedio) * 100) }));

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
      total: Math.round(totalGeral * 100) / 100, categorias,
      consumo: { detalhes: consumo, media_km_por_litro: consumoMedio, anomalias, usando_tanque_cheio: tanqueCheio.length >= 2 },
      detalhes: { manutencoes, multas, abastecimentos, pagamentos_seguro: pagamentosSeguro, pagamento_documentos: pagamentoDocumentos },
    });
  } catch (error) { handleError(res, error, 'gastos'); }
}

async function list(req, res) {
  const { data_inicio, data_fim } = req.query;
  try {
    const veiculos = await sequelize.query('SELECT placa, fipe_modelo, tipo FROM veiculos ORDER BY placa', { type: sequelize.QueryTypes.SELECT });

    const params = [];
    const manutDate = buildDateClause('data', data_inicio, data_fim, params);
    const multasDate = buildDateClause('data_ocorrencia', data_inicio, data_fim, params);
    const pgtoDate = buildDateClause('data_pagamento', data_inicio, data_fim, params);
    const pgtoDocDate = buildDateClause('data_pagamento', data_inicio, data_fim, params);

    const rows = await sequelize.query(`
      SELECT veiculo_id, SUM(valor) as total FROM (
        SELECT veiculo_id, valor FROM manutencoes WHERE veiculo_id IS NOT NULL ${manutDate}
        UNION ALL SELECT veiculo_id, valor FROM multas WHERE veiculo_id IS NOT NULL ${multasDate}
        UNION ALL SELECT veiculo_id, valor FROM abastecimentos WHERE veiculo_id IS NOT NULL ${manutDate}
        UNION ALL SELECT veiculo_id, valor FROM pagamentos_seguro WHERE veiculo_id IS NOT NULL ${pgtoDate}
        UNION ALL SELECT veiculo_id, valor FROM pagamento_documentos WHERE veiculo_id IS NOT NULL ${pgtoDocDate}
      ) sub GROUP BY veiculo_id ORDER BY total DESC
    `, { bind: params, type: sequelize.QueryTypes.SELECT });

    const totais = rows.map((r) => {
      const v = veiculos.find((v) => v.placa === r.veiculo_id);
      return { placa: r.veiculo_id, modelo: v ? (v.fipe_modelo || v.tipo || '') : '', total: Math.round((parseFloat(r.total) || 0) * 100) / 100 };
    });
    res.json(totais);
  } catch (error) { handleError(res, error, 'gastos'); }
}

module.exports = { byPlaca, list };
