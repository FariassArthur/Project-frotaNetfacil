const { sequelize } = require('../../database/sequelize');
const { handleError } = require('../../services/errorHandler');

const BASE_QUERY = `
  SELECT c.id, c.nome, c.uf,
    COALESCE(STRING_AGG(DISTINCT v.placa, ','), '') as veiculos,
    COUNT(DISTINCT v.placa) as veiculos_count,
    COALESCE(STRING_AGG(DISTINCT cn.nome, ','), '') as motoristas,
    COUNT(DISTINCT cn.numero_registro) as motoristas_count
  FROM cidades c
  LEFT JOIN veiculos v ON v.cidade_id = c.id
  LEFT JOIN cnhs cn ON cn.veiculo_id = v.placa
`;

async function list(req, res) {
  try {
    const rows = await sequelize.query(`${BASE_QUERY} GROUP BY c.id ORDER BY c.nome`, {
      type: sequelize.QueryTypes.SELECT,
    });
    res.json(rows);
  } catch (error) { handleError(res, error, 'cidades'); }
}

async function get(req, res) {
  try {
    const rows = await sequelize.query(`${BASE_QUERY} WHERE c.id = ? GROUP BY c.id ORDER BY c.nome`, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT,
    });
    const row = rows[0];
    if (!row) return res.status(404).json({ error: 'Cidade não encontrada' });
    res.json(row);
  } catch (error) { handleError(res, error, 'cidades'); }
}

module.exports = { list, get };
