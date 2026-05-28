const { all, get } = require('../database/connection');
const { handleError } = require('../services/errorHandler');

function registerCidadesRoutes(app) {
  app.get('/api/cidades', async (req, res) => {
    try {
      const rows = await all(`
        SELECT c.id, c.nome, c.uf,
          COALESCE(GROUP_CONCAT(DISTINCT v.placa), '') as veiculos,
          COUNT(DISTINCT v.placa) as veiculos_count,
          COALESCE(GROUP_CONCAT(DISTINCT cn.nome), '') as motoristas,
          COUNT(DISTINCT cn.numero_registro) as motoristas_count
        FROM cidades c
        LEFT JOIN veiculos v ON v.cidade_id = c.id
        LEFT JOIN cnhs cn ON cn.veiculo_id = v.placa
        GROUP BY c.id
        ORDER BY c.nome
      `);
      res.json(rows);
    } catch (error) {
      handleError(res, error, 'cidades');
    }
  });

  app.get('/api/cidades/:id', async (req, res) => {
    try {
      const row = await get(`
        SELECT c.id, c.nome, c.uf,
          COALESCE(GROUP_CONCAT(DISTINCT v.placa), '') as veiculos,
          COUNT(DISTINCT v.placa) as veiculos_count,
          COALESCE(GROUP_CONCAT(DISTINCT cn.nome), '') as motoristas,
          COUNT(DISTINCT cn.numero_registro) as motoristas_count
        FROM cidades c
        LEFT JOIN veiculos v ON v.cidade_id = c.id
        LEFT JOIN cnhs cn ON cn.veiculo_id = v.placa
        WHERE c.id = ?
        GROUP BY c.id
      `, [req.params.id]);
      if (!row) return res.status(404).json({ error: 'Cidade não encontrada' });
      res.json(row);
    } catch (error) {
      handleError(res, error, 'cidades');
    }
  });
}

module.exports = { registerCidadesRoutes };
