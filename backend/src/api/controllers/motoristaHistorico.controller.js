const { sequelize } = require('../../database/sequelize');
const { Cnh } = require('../../database/models');
const { handleError } = require('../../services/errorHandler');
const { parseBool } = require('../utils/helpers');

async function historico(req, res) {
  try {
    const { registro } = req.params;
    const motorista = await Cnh.findOne({
      where: { numero_registro: registro },
      attributes: ['numero_registro', 'nome', 'cnh', 'validade_cnh', 'veiculo_id'],
    });
    if (!motorista) return res.status(404).json({ error: 'Motorista não encontrado' });

    const [multas, viagens, abastecimentos] = await Promise.all([
      sequelize.query(
        `SELECT m.id, m.motorista_id, m.veiculo_id, m.valor, m.data_ocorrencia, m.data_vencimento,
                m.pagamento_realizado, m.descricao, v.placa, v.fipe_modelo
         FROM multas m LEFT JOIN veiculos v ON m.veiculo_id = v.placa
         WHERE m.motorista_id = :registro ORDER BY m.data_ocorrencia DESC`,
        { replacements: { registro }, type: sequelize.QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT v.id, v.motorista_id, v.veiculo_id, v.data_saida, v.data_retorno, v.destino, v.km_saida, v.km_retorno,
                ve.placa, ve.fipe_modelo, ve.numero
         FROM viagens v LEFT JOIN veiculos ve ON v.veiculo_id = ve.placa
         WHERE v.motorista_id = :registro ORDER BY v.data_saida DESC`,
        { replacements: { registro }, type: sequelize.QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT a.id, a.veiculo_id, a.data, a.litros, a.km, a.valor_total, v.placa, v.fipe_modelo
         FROM abastecimentos a LEFT JOIN veiculos v ON a.veiculo_id = v.placa
         WHERE a.veiculo_id IN (SELECT veiculo_id FROM cnhs WHERE numero_registro = :registro)
         ORDER BY a.data DESC LIMIT 50`,
        { replacements: { registro }, type: sequelize.QueryTypes.SELECT }
      ),
    ]);

    const multasParsed = multas.map(m => ({ ...m, pagamento_realizado: parseBool(m.pagamento_realizado) }));

    res.json({
      motorista, multas: multasParsed, viagens, abastecimentos,
      resumo: {
        total_multas: multasParsed.reduce((s, m) => s + (m.valor || 0), 0),
        total_viagens: viagens.length,
        total_abastecimentos: abastecimentos.length,
        multas_pendentes: multasParsed.filter(m => !m.pagamento_realizado).length,
      },
    });
  } catch (error) { handleError(res, error, 'motorista.historico'); }
}

module.exports = { historico };
