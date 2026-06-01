const { run, all, get, sqlDate } = require('../database/connection');
const { requireRole } = require('../middleware/auth');
const { handleError } = require('../services/errorHandler');

function registerManutencaoPreventivaRoutes(app) {
  app.get('/api/manutencao-preventiva/config', async (req, res) => {
    try {
      const { veiculo_id } = req.query;
      const filters = [];
      const params = [];
      if (veiculo_id) {
        filters.push('c.veiculo_id = ?');
        params.push(veiculo_id);
      }
      const where = filters.length ? 'WHERE ' + filters.join(' AND ') : '';
      const rows = await all(`
        SELECT c.*, t.descricao as tipo_descricao
        FROM config_manutencao_preventiva c
        LEFT JOIN tipo_manutencao t ON c.tipo_manutencao_id = t.id
        ${where} ORDER BY c.km_proxima
      `, params);
      res.json(rows);
    } catch (error) {
      handleError(res, error, 'manutencao-preventiva.config');
    }
  });

  app.post('/api/manutencao-preventiva/config', async (req, res) => {
    try {
      const { veiculo_id, tipo_manutencao_id, descricao, km_intervalo, km_proxima, meses_intervalo, data_proxima, ativo } = req.body;
      const result = await run(
        `INSERT INTO config_manutencao_preventiva (veiculo_id, tipo_manutencao_id, descricao, km_intervalo, km_proxima, meses_intervalo, data_proxima, ativo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [veiculo_id, tipo_manutencao_id || null, descricao || null, km_intervalo || null, km_proxima || null, meses_intervalo || null, data_proxima || null, ativo !== undefined ? (ativo ? 1 : 0) : 1]
      );
      res.status(201).json({ ok: true, id: result.lastID || result.rows?.[0]?.id });
    } catch (error) {
      handleError(res, error, 'manutencao-preventiva.config');
    }
  });

  app.put('/api/manutencao-preventiva/config/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await get('SELECT * FROM config_manutencao_preventiva WHERE id = ?', [id]);
      if (!existing) return res.status(404).json({ error: 'Configuração não encontrada' });

      const body = req.body;
      await run(
        `UPDATE config_manutencao_preventiva SET veiculo_id = ?, tipo_manutencao_id = ?, descricao = ?, km_intervalo = ?, km_proxima = ?, meses_intervalo = ?, data_proxima = ?, ativo = ? WHERE id = ?`,
        [
          body.veiculo_id ?? existing.veiculo_id,
          body.tipo_manutencao_id !== undefined ? body.tipo_manutencao_id : existing.tipo_manutencao_id,
          body.descricao !== undefined ? body.descricao : existing.descricao,
          body.km_intervalo !== undefined ? body.km_intervalo : existing.km_intervalo,
          body.km_proxima !== undefined ? body.km_proxima : existing.km_proxima,
          body.meses_intervalo !== undefined ? body.meses_intervalo : existing.meses_intervalo,
          body.data_proxima !== undefined ? body.data_proxima : existing.data_proxima,
          body.ativo !== undefined ? (body.ativo ? 1 : 0) : existing.ativo,
          id
        ]
      );
      res.json({ ok: true });
    } catch (error) {
      handleError(res, error, 'manutencao-preventiva.config');
    }
  });

  app.delete('/api/manutencao-preventiva/config/:id', requireRole('admin', 'root'), async (req, res) => {
    try {
      await run('DELETE FROM config_manutencao_preventiva WHERE id = ?', [req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      handleError(res, error, 'manutencao-preventiva.config');
    }
  });

  app.get('/api/manutencao-preventiva/alertas', async (req, res) => {
    try {
      const hoje = new Date().toISOString().slice(0, 10);

      const alertas = await all(`
        SELECT c.*, v.placa, v.fipe_modelo, v.km as km_atual,
               t.descricao as tipo_descricao
        FROM config_manutencao_preventiva c
        JOIN veiculos v ON c.veiculo_id = v.placa
        LEFT JOIN tipo_manutencao t ON c.tipo_manutencao_id = t.id
        WHERE c.ativo = 1
          AND (
            (c.km_proxima IS NOT NULL AND v.km >= c.km_proxima)
            OR
            (c.data_proxima IS NOT NULL AND c.data_proxima <= ?)
          )
        ORDER BY c.km_proxima ASC
      `, [hoje]);

      const proximos = await all(`
        SELECT c.*, v.placa, v.fipe_modelo, v.km as km_atual,
               t.descricao as tipo_descricao
        FROM config_manutencao_preventiva c
        JOIN veiculos v ON c.veiculo_id = v.placa
        LEFT JOIN tipo_manutencao t ON c.tipo_manutencao_id = t.id
        WHERE c.ativo = 1
          AND (
            (c.km_proxima IS NOT NULL AND v.km >= (c.km_proxima - c.km_intervalo * 0.1) AND v.km < c.km_proxima)
            OR
            (c.data_proxima IS NOT NULL AND c.data_proxima > ? AND c.data_proxima <= ${sqlDate("?,'+7 days'")})
          )
        ORDER BY c.km_proxima ASC
      `, [hoje, hoje]);

      res.json({ alertas, proximos });
    } catch (error) {
      handleError(res, error, 'manutencao-preventiva.alertas');
    }
  });

  app.post('/api/manutencao-preventiva/checkin', async (req, res) => {
    try {
      const alertas = await all(`
        SELECT c.*, v.placa
        FROM config_manutencao_preventiva c
        JOIN veiculos v ON c.veiculo_id = v.placa
        WHERE c.ativo = 1
          AND (
            (c.km_proxima IS NOT NULL AND v.km >= c.km_proxima)
            OR
            (c.data_proxima IS NOT NULL AND c.data_proxima <= ${sqlDate('now')})
          )
      `);

      const now = new Date().toISOString().slice(0, 10);
      let updated = 0;
      for (const cfg of alertas) {
        const veiculo = await get('SELECT km FROM veiculos WHERE placa = ?', [cfg.veiculo_id]);
        if (!veiculo) continue;

        const nextKm = cfg.km_intervalo ? (veiculo.km + cfg.km_intervalo) : null;
        let nextDate = null;
        if (cfg.meses_intervalo) {
          const d = new Date();
          d.setMonth(d.getMonth() + cfg.meses_intervalo);
          nextDate = d.toISOString().slice(0, 10);
        }

        await run(
          `UPDATE config_manutencao_preventiva SET km_proxima = ?, data_proxima = ? WHERE id = ?`,
          [nextKm, nextDate, cfg.id]
        );
        updated++;
      }

      res.json({ ok: true, updated });
    } catch (error) {
      handleError(res, error, 'manutencao-preventiva.checkin');
    }
  });
}

module.exports = { registerManutencaoPreventivaRoutes };
