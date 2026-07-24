const { sequelize } = require('../../database/sequelize');
const { Cnh } = require('../../database/models');
const { handleError } = require('../../services/errorHandler');
const { parseBool } = require('../utils/helpers');

async function list(req, res) {
  try {
    const rows = await sequelize.query(`
      SELECT c.numero_registro, c.nome AS motorista_nome,
        COUNT(m.id) AS total_multas,
        COALESCE(SUM(m.valor), 0) AS valor_total,
        COALESCE(SUM(CASE WHEN m.pagamento_realizado = true THEN 1 ELSE 0 END), 0) AS pagas,
        COALESCE(SUM(CASE WHEN m.pagamento_realizado IS NOT TRUE THEN 1 ELSE 0 END), 0) AS pendentes,
        COALESCE(SUM(CASE WHEN m.pagamento_realizado IS NOT TRUE THEN m.valor ELSE 0 END), 0) AS valor_pendente,
        STRING_AGG(DISTINCT m.veiculo_id, ',') AS veiculos
      FROM cnhs c LEFT JOIN multas m ON c.numero_registro = m.motorista_id
      GROUP BY c.numero_registro, c.nome HAVING COUNT(m.id) > 0 ORDER BY valor_total DESC
    `, { type: sequelize.QueryTypes.SELECT });

    const totalGeral = rows.reduce((s, r) => s + Number(r.valor_total), 0);
    res.json({ motoristas: rows, total_geral: totalGeral });
  } catch (error) { handleError(res, error, 'motorista-multas'); }
}

async function detail(req, res) {
  try {
    const motorista = await Cnh.findOne({
      where: { numero_registro: req.params.registro },
      attributes: ['nome', 'numero_registro'],
    });
    if (!motorista) return res.status(404).json({ error: 'Motorista não encontrado' });

    const multas = await sequelize.query(
      `SELECT m.id, m.motorista_id, m.veiculo_id, m.valor, m.data_ocorrencia, m.data_vencimento,
              m.pagamento_realizado, m.descricao, v.placa, v.fipe_modelo
       FROM multas m LEFT JOIN veiculos v ON m.veiculo_id = v.placa
       WHERE m.motorista_id = :registro ORDER BY m.data_vencimento DESC`,
      { replacements: { registro: req.params.registro }, type: sequelize.QueryTypes.SELECT }
    );

    const multasParsed = multas.map(m => ({ ...m, pagamento_realizado: parseBool(m.pagamento_realizado) }));
    const total = multasParsed.reduce((s, m) => s + (m.valor || 0), 0);

    res.json({ motorista, multas: multasParsed, total });
  } catch (error) { handleError(res, error, 'motorista-multas.detail'); }
}

module.exports = { list, detail };
