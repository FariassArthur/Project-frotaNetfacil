const { run, all, get, sqlDate } = require('../database/connection');
const { requireRole } = require('../middleware/auth');
const { handleError } = require('../services/errorHandler');

function registerViagensRoutes(app) {
  app.get('/api/viagens/ativas', async (req, res) => {
    try {
      const rows = await all(`
        SELECT v.*, c.nome as motorista_nome, vei.fipe_modelo as veiculo_modelo
        FROM viagens v
        LEFT JOIN cnhs c ON v.motorista_id = c.numero_registro
        LEFT JOIN veiculos vei ON v.veiculo_id = vei.placa
        WHERE v.km_final IS NULL
        ORDER BY v.data_saida DESC
      `);
      res.json(rows);
    } catch (error) {
      handleError(res, error, 'viagens');
    }
  });

  app.get('/api/viagens/estatisticas', async (req, res) => {
    try {
      const { veiculo_id, data_inicio, data_fim } = req.query;
      const filters = [];
      const params = [];
      if (veiculo_id) { filters.push('v.veiculo_id = ?'); params.push(veiculo_id); }
      if (data_inicio) { filters.push('v.data_saida >= ?'); params.push(data_inicio); }
      if (data_fim) { filters.push('v.data_saida <= ?'); params.push(data_fim); }
      const where = filters.length ? 'WHERE ' + filters.join(' AND ') : '';

      const totalViagens = await get(`SELECT COUNT(*) as total FROM viagens v ${where}`, params);

      const kmWhere = where
        ? where + ' AND v.km_final IS NOT NULL AND v.km_inicial IS NOT NULL'
        : 'WHERE v.km_final IS NOT NULL AND v.km_inicial IS NOT NULL';
      const totalKm = await get(
        `SELECT COALESCE(SUM(v.km_final - v.km_inicial), 0) as total FROM viagens v ${kmWhere}`,
        params
      );

      const porVeiculo = await all(`
        SELECT v.veiculo_id, vei.fipe_modelo,
               COUNT(*) as total_viagens,
               COALESCE(SUM(CASE WHEN v.km_final IS NOT NULL AND v.km_inicial IS NOT NULL THEN v.km_final - v.km_inicial ELSE 0 END), 0) as total_km
        FROM viagens v
        LEFT JOIN veiculos vei ON v.veiculo_id = vei.placa
        ${where} GROUP BY v.veiculo_id ORDER BY total_viagens DESC
      `, params);

      const hoje = new Date().toISOString().slice(0, 10);
      const mesAtual = await get(
        `SELECT COUNT(*) as total FROM viagens v WHERE v.data_saida >= ${sqlDate('?')} AND v.data_saida <= ?`,
        [hoje.slice(0, 7) + '-01', hoje]
      );

      res.json({
        total_viagens: totalViagens?.total || 0,
        total_km: totalKm?.total || 0,
        mes_atual: mesAtual?.total || 0,
        por_veiculo: porVeiculo,
      });
    } catch (error) {
      handleError(res, error, 'viagens');
    }
  });

  app.get('/api/viagens/ultima/:placa', async (req, res) => {
    try {
      const row = await get(`
        SELECT * FROM viagens
        WHERE veiculo_id = ? AND km_final IS NOT NULL
        ORDER BY data_retorno DESC LIMIT 1
      `, [req.params.placa]);
      res.json(row || null);
    } catch (error) {
      handleError(res, error, 'viagens');
    }
  });

  app.get('/api/viagens', async (req, res) => {
    try {
      const { veiculo_id, motorista_id, _page, _limit } = req.query;
      const filters = [];
      const params = [];
      if (veiculo_id) { filters.push('v.veiculo_id = ?'); params.push(veiculo_id); }
      if (motorista_id) { filters.push('v.motorista_id = ?'); params.push(motorista_id); }
      const where = filters.length ? 'WHERE ' + filters.join(' AND ') : '';

      const page = Math.max(1, parseInt(_page, 10) || 1);
      const limit = Math.min(500, Math.max(1, parseInt(_limit, 10) || 200));
      const offset = (page - 1) * limit;

      const countResult = await all(`SELECT COUNT(*) as total FROM viagens v ${where}`, params);
      const total = countResult[0]?.total || 0;

      const rows = await all(`
        SELECT v.*, c.nome as motorista_nome, vei.fipe_modelo as veiculo_modelo
        FROM viagens v
        LEFT JOIN cnhs c ON v.motorista_id = c.numero_registro
        LEFT JOIN veiculos vei ON v.veiculo_id = vei.placa
        ${where} ORDER BY v.data_saida DESC LIMIT ? OFFSET ?
      `, [...params, limit, offset]);
      res.set('X-Total-Count', String(total));
      res.json(rows);
    } catch (error) {
      handleError(res, error, 'viagens');
    }
  });

  app.get('/api/viagens/:id', async (req, res) => {
    try {
      const row = await get(`
        SELECT v.*, c.nome as motorista_nome
        FROM viagens v
        LEFT JOIN cnhs c ON v.motorista_id = c.numero_registro
        WHERE v.id = ?
      `, [req.params.id]);
      if (!row) return res.status(404).json({ error: 'Viagem não encontrada' });
      res.json(row);
    } catch (error) {
      handleError(res, error, 'viagens');
    }
  });

  app.post('/api/viagens', async (req, res) => {
    try {
      const { veiculo_id, motorista_id, data_saida, data_retorno, km_inicial, km_final, destino, descricao } = req.body;
      const now = new Date().toISOString().slice(0, 10);
      const result = await run(
        `INSERT INTO viagens (veiculo_id, motorista_id, data_saida, data_saida_s, data_retorno, data_retorno_s, km_inicial, km_final, destino, descricao)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          veiculo_id,
          motorista_id || null,
          data_saida || now,
          data_saida || now,
          data_retorno || null,
          data_retorno || null,
          km_inicial !== undefined && km_inicial !== null && km_inicial !== '' ? parseInt(km_inicial, 10) : null,
          km_final !== undefined && km_final !== null && km_final !== '' ? parseInt(km_final, 10) : null,
          destino || null,
          descricao || null
        ]
      );

      if (km_final !== undefined && km_final !== null && km_final !== '') {
        await run('UPDATE veiculos SET km = ? WHERE placa = ?', [parseInt(km_final, 10), veiculo_id]);
      }

      res.status(201).json({ ok: true, id: result.lastID || result.rows?.[0]?.id });
    } catch (error) {
      handleError(res, error, 'viagens');
    }
  });

  app.put('/api/viagens/:id', async (req, res) => {
    try {
      const existing = await get('SELECT * FROM viagens WHERE id = ?', [req.params.id]);
      if (!existing) return res.status(404).json({ error: 'Viagem não encontrada' });

      const body = req.body;
      await run(
        `UPDATE viagens SET veiculo_id = ?, motorista_id = ?, data_saida = ?, data_retorno = ?,
         km_inicial = ?, km_final = ?, destino = ?, descricao = ? WHERE id = ?`,
        [
          body.veiculo_id ?? existing.veiculo_id,
          body.motorista_id !== undefined ? body.motorista_id : existing.motorista_id,
          body.data_saida ?? existing.data_saida,
          body.data_retorno !== undefined ? body.data_retorno : existing.data_retorno,
          body.km_inicial !== undefined ? parseInt(body.km_inicial, 10) : existing.km_inicial,
          body.km_final !== undefined ? parseInt(body.km_final, 10) : existing.km_final,
          body.destino !== undefined ? body.destino : existing.destino,
          body.descricao !== undefined ? body.descricao : existing.descricao,
          req.params.id
        ]
      );

      const updated = await get('SELECT * FROM viagens WHERE id = ?', [req.params.id]);
      if (updated?.km_final && updated?.veiculo_id) {
        await run('UPDATE veiculos SET km = ? WHERE placa = ?', [updated.km_final, updated.veiculo_id]);
      }

      res.json({ ok: true });
    } catch (error) {
      handleError(res, error, 'viagens');
    }
  });

  app.delete('/api/viagens/:id', requireRole('admin', 'root'), async (req, res) => {
    try {
      await run('DELETE FROM viagens WHERE id = ?', [req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      handleError(res, error, 'viagens');
    }
  });
}

module.exports = { registerViagensRoutes };
