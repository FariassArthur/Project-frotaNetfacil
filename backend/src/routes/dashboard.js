const { all } = require('../database/connection');
const { handleError } = require('../services/errorHandler');

const ALLOWED_TABLES = {
  veiculos: true, cnhs: true, mecanicas: true, manutencoes: true,
  multas: true, seguradoras: true, contratos_seguro: true,
  pagamentos_seguro: true, pagamento_documentos: true,
  abastecimentos: true, higienizacao: true, combustiveis: true,
  tipo_manutencao: true, cidades: true,
};

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
  { key: 'higienizacao', label: 'Higienização' },
  { key: 'cidades', label: 'Cidades' },
  { key: 'combustiveis', label: 'Combustíveis' },
  { key: 'tipo_manutencao', label: 'Tipos Manutenção' },
];

function registerDashboardRoutes(app) {
  app.get('/api/dashboard', async (req, res) => {
    try {
      const result = {};
      const limit = Math.min(500, parseInt(req.query._limit, 10) || 200);
      for (const table of TABLES) {
        if (!ALLOWED_TABLES[table.key]) continue;
        const rows = await all(`SELECT * FROM ${table.key} ORDER BY 1 LIMIT ?`, [limit]);
        result[table.key] = {
          label: table.label,
          count: rows.length,
          rows,
          columns: rows.length > 0 ? Object.keys(rows[0]) : []
        };
      }
      res.json(result);
    } catch (error) {
      handleError(res, error, 'dashboard');
    }
  });

  app.get('/api/dashboard/pagamentos', async (req, res) => {
    try {
      const hoje = new Date().toISOString().slice(0, 10);

      const multas = await all(`
        SELECT id, 'Multa' AS tipo, veiculo_id, local_ocorrencia AS descricao,
               valor, data_vencimento, pagamento_realizado
        FROM multas WHERE data_vencimento IS NOT NULL
      `);

      const documentos = await all(`
        SELECT id, 'Documento' AS tipo, veiculo_id, descricao,
               valor, data_vencimento, data_pagamento
        FROM pagamento_documentos WHERE data_vencimento IS NOT NULL
      `);

      const noPrazo = { multas: 0, documentos: 0 };
      const emAtraso = { multas: 0, documentos: 0 };
      const atrasados = [];
      const noPrazoList = [];

      const classify = (item, pago) => {
        const venc = item.data_vencimento;
        if (!venc) return;
        if (pago) {
          noPrazo[item.tipo === 'Multa' ? 'multas' : 'documentos']++;
          noPrazoList.push({ ...item, situacao: 'Pago', data_vencimento: venc });
          return;
        }
        if (venc < hoje) {
          emAtraso[item.tipo === 'Multa' ? 'multas' : 'documentos']++;
          const dias = Math.floor((new Date(hoje) - new Date(venc)) / (1000 * 60 * 60 * 24));
          atrasados.push({ ...item, dias_atraso: dias, data_vencimento: venc });
        } else {
          noPrazo[item.tipo === 'Multa' ? 'multas' : 'documentos']++;
          noPrazoList.push({ ...item, situacao: 'A vencer', data_vencimento: venc });
        }
      };

      for (const m of multas) classify(m, m.pagamento_realizado == 1);
      for (const d of documentos) classify(d, d.data_pagamento != null);

      const totalNoPrazo = noPrazo.multas + noPrazo.documentos;
      const totalEmAtraso = emAtraso.multas + emAtraso.documentos;

      res.json({
        noPrazo: { total: totalNoPrazo, ...noPrazo },
        emAtraso: { total: totalEmAtraso, ...emAtraso },
        atrasados,
        noPrazoList,
      });
    } catch (error) {
      handleError(res, error, 'dashboard.pagamentos');
    }
  });
}

module.exports = { registerDashboardRoutes };
