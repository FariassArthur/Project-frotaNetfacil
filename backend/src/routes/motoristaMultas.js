const { all } = require('../database/connection');
const { handleError } = require('../services/errorHandler');

function registerMotoristaMultasRoutes(app) {
  app.get('/api/motorista-multas', async (req, res) => {
    try {
      const rows = await all(`
        SELECT
          c.numero_registro,
          c.nome AS motorista_nome,
          COUNT(m.id) AS total_multas,
          COALESCE(SUM(m.valor), 0) AS valor_total,
          COALESCE(SUM(CASE WHEN m.pagamento_realizado = 1 THEN 1 ELSE 0 END), 0) AS pagas,
          COALESCE(SUM(CASE WHEN m.pagamento_realizado IS NULL OR m.pagamento_realizado = 0 THEN 1 ELSE 0 END), 0) AS pendentes,
          COALESCE(SUM(CASE WHEN m.pagamento_realizado IS NULL OR m.pagamento_realizado = 0 THEN m.valor ELSE 0 END), 0) AS valor_pendente,
          GROUP_CONCAT(DISTINCT m.veiculo_id) AS veiculos
        FROM cnhs c
        LEFT JOIN multas m ON c.numero_registro = m.motorista_id
        GROUP BY c.numero_registro
        HAVING total_multas > 0
        ORDER BY valor_total DESC
      `);

      const totalGeral = rows.reduce((s, r) => s + r.valor_total, 0);
      res.json({ motoristas: rows, total_geral: totalGeral });
    } catch (error) {
      handleError(res, error, 'motorista-multas');
    }
  });

  app.get('/api/motorista-multas/:registro', async (req, res) => {
    try {
      const multas = await all(`
        SELECT m.*, v.placa, v.fipe_modelo
        FROM multas m
        LEFT JOIN veiculos v ON m.veiculo_id = v.placa
        WHERE m.motorista_id = ?
        ORDER BY m.data_vencimento DESC
      `, [req.params.registro]);

      const motorista = await all(`SELECT nome, numero_registro FROM cnhs WHERE numero_registro = ?`, [req.params.registro]);

      res.json({
        motorista: motorista[0] || null,
        multas,
        total: multas.reduce((s, m) => s + (m.valor || 0), 0),
      });
    } catch (error) {
      handleError(res, error, 'motorista-multas.detail');
    }
  });
}

module.exports = { registerMotoristaMultasRoutes };
