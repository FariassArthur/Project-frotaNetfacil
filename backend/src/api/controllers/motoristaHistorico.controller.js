const { sequelize } = require('../../database/sequelize');
const { Cnh } = require('../../database/models');
const { handleError } = require('../../services/errorHandler');

async function historico(req, res) {
  try {
    const { registro } = req.params;
    const motorista = await Cnh.findOne({ where: { numero_registro: registro } });
    if (!motorista) return res.status(404).json({ error: 'Motorista não encontrado' });
    const [multas, viagens, abastecimentos] = await Promise.all([
      sequelize.query(`SELECT m.*, v.placa, v.fipe_modelo FROM multas m LEFT JOIN veiculos v ON m.veiculo_id = v.placa WHERE m.motorista_id = ? ORDER BY m.data_ocorrencia DESC`, { replacements: [registro], type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`SELECT v.*, ve.placa, ve.fipe_modelo, ve.numero FROM viagens v LEFT JOIN veiculos ve ON v.veiculo_id = ve.placa WHERE v.motorista_id = ? ORDER BY v.data_saida DESC`, { replacements: [registro], type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`SELECT a.*, v.placa, v.fipe_modelo FROM abastecimentos a LEFT JOIN veiculos v ON a.veiculo_id = v.placa WHERE a.veiculo_id IN (SELECT veiculo_id FROM cnhs WHERE numero_registro = ?) ORDER BY a.data DESC LIMIT 50`, { replacements: [registro], type: sequelize.QueryTypes.SELECT }),
    ]);
    res.json({
      motorista, multas: multas || [], viagens: viagens || [], abastecimentos: abastecimentos || [],
      resumo: {
        total_multas: multas.reduce((s, m) => s + (m.valor || 0), 0),
        total_viagens: viagens.length,
        total_abastecimentos: abastecimentos.length,
        multas_pendentes: multas.filter(m => !m.pagamento_realizado).length,
      },
    });
  } catch (error) { handleError(res, error, 'motorista.historico'); }
}

module.exports = { historico };
