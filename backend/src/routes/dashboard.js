const { openDb, all } = require('../database/connection');

const TABLES = [
  { key: 'veiculos', label: 'Veículos' },
  { key: 'cnhs', label: 'CNHs' },
  { key: 'mecanicas', label: 'Mecânicas' },
  { key: 'manutencoes', label: 'Manutenções' },
  { key: 'multas', label: 'Multas' },
  { key: 'seguradoras', label: 'Seguradoras' },
  { key: 'contratos_seguro', label: 'Contratos Seguro' },
  { key: 'pagamentos_seguro', label: 'Pagamentos Seguro' },
  { key: 'pagamento_documentos', label: 'Pagamentos Documento' },
  { key: 'abastecimentos', label: 'Abastecimentos' },
  { key: 'combustiveis', label: 'Combustíveis' },
  { key: 'tipo_manutencao', label: 'Tipos Manutenção' },
];

function registerDashboardRoutes(app) {
  app.get('/api/dashboard', async (req, res) => {
    const db = openDb();
    try {
      const result = {};
      for (const table of TABLES) {
        const rows = await all(db, `SELECT * FROM ${table.key} ORDER BY 1`);
        result[table.key] = {
          label: table.label,
          count: rows.length,
          rows,
          columns: rows.length > 0 ? Object.keys(rows[0]) : []
        };
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });
}

module.exports = { registerDashboardRoutes };
