const { run, all, get, parseInteger } = require('../database/connection');
const { requireRole } = require('../middleware/auth');
const { handleError } = require('../services/errorHandler');

function registerOrdensServicoRoutes(app) {
  app.get('/api/ordens-servico', async (req, res) => {
    try {
      const { veiculo_id, status } = req.query;
      const filters = [];
      const params = [];
      if (veiculo_id) { filters.push('os.veiculo_id = ?'); params.push(veiculo_id); }
      if (status) { filters.push('os.status = ?'); params.push(status); }
      const where = filters.length ? 'WHERE ' + filters.join(' AND ') : '';

      const page = Math.max(1, parseInt(req.query._page, 10) || 1);
      const limit = Math.min(500, Math.max(1, parseInt(req.query._limit, 10) || 200));
      const offset = (page - 1) * limit;

      const countResult = await all(`SELECT COUNT(*) as total FROM ordens_servico os ${where}`, params);
      const total = countResult[0]?.total || 0;

      const rows = await all(`
        SELECT os.*, v.placa, v.fipe_modelo, m.nome as mecanica_nome
        FROM ordens_servico os
        LEFT JOIN veiculos v ON os.veiculo_id = v.placa
        LEFT JOIN mecanicas m ON os.mecanica_id = m.id
        ${where} ORDER BY os.created_at DESC LIMIT ? OFFSET ?
      `, [...params, limit, offset]);
      res.set('X-Total-Count', String(total));
      res.json(rows);
    } catch (error) {
      handleError(res, error, 'ordens-servico.list');
    }
  });

  app.get('/api/ordens-servico/:id', async (req, res) => {
    try {
      const row = await get(`
        SELECT os.*, v.placa, v.fipe_modelo, m.nome as mecanica_nome
        FROM ordens_servico os
        LEFT JOIN veiculos v ON os.veiculo_id = v.placa
        LEFT JOIN mecanicas m ON os.mecanica_id = m.id
        WHERE os.id = ?
      `, [req.params.id]);
      if (!row) return res.status(404).json({ error: 'Ordem não encontrada' });
      res.json(row);
    } catch (error) {
      handleError(res, error, 'ordens-servico.get');
    }
  });

  app.post('/api/ordens-servico', async (req, res) => {
    try {
      const { veiculo_id, numero_os, data_abertura, km_atual, descricao, tipo, prioridade, mecanica_id, valor_mao_obra, valor_pecas, observacoes } = req.body;
      if (!veiculo_id || !data_abertura) {
        return res.status(400).json({ error: 'veiculo_id e data_abertura são obrigatórios' });
      }
      const result = await run(
        `INSERT INTO ordens_servico (veiculo_id, numero_os, data_abertura, km_atual, descricao, tipo, prioridade, mecanica_id, valor_mao_obra, valor_pecas, observacoes, criado_por)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [veiculo_id, numero_os || null, data_abertura, km_atual || null, descricao || null, tipo || 'corretiva', prioridade || 'normal', mecanica_id || null, valor_mao_obra || null, valor_pecas || null, observacoes || null, req.user?.username || null]
      );
      res.status(201).json({ ok: true, id: result.lastID || result.rows?.[0]?.id });
    } catch (error) {
      handleError(res, error, 'ordens-servico.create');
    }
  });

  app.put('/api/ordens-servico/:id', async (req, res) => {
    try {
      const existing = await get('SELECT * FROM ordens_servico WHERE id = ?', [req.params.id]);
      if (!existing) return res.status(404).json({ error: 'Ordem não encontrada' });

      const b = req.body;
      await run(`UPDATE ordens_servico SET
        veiculo_id = ?, numero_os = ?, data_abertura = ?, data_conclusao = ?,
        km_atual = ?, descricao = ?, tipo = ?, status = ?, prioridade = ?,
        mecanica_id = ?, valor_mao_obra = ?, valor_pecas = ?, observacoes = ?,
        updated_at = datetime('now')
        WHERE id = ?`, [
        b.veiculo_id ?? existing.veiculo_id,
        b.numero_os ?? existing.numero_os,
        b.data_abertura ?? existing.data_abertura,
        b.data_conclusao ?? existing.data_conclusao,
        b.km_atual ?? existing.km_atual,
        b.descricao ?? existing.descricao,
        b.tipo ?? existing.tipo,
        b.status ?? existing.status,
        b.prioridade ?? existing.prioridade,
        b.mecanica_id !== undefined ? b.mecanica_id : existing.mecanica_id,
        b.valor_mao_obra ?? existing.valor_mao_obra,
        b.valor_pecas ?? existing.valor_pecas,
        b.observacoes ?? existing.observacoes,
        req.params.id
      ]);
      res.json({ ok: true });
    } catch (error) {
      handleError(res, error, 'ordens-servico.update');
    }
  });

  app.patch('/api/ordens-servico/:id/status', async (req, res) => {
    try {
      const { status, data_conclusao, km_atual } = req.body;
      const allowed = ['aberta', 'em_andamento', 'concluida', 'cancelada'];
      if (!allowed.includes(status)) return res.status(400).json({ error: 'Status inválido' });

      const sets = ["status = ?", "updated_at = datetime('now')"];
      const params = [status];
      if (data_conclusao) { sets.push("data_conclusao = ?"); params.push(data_conclusao); }
      if (km_atual) { sets.push("km_atual = ?"); params.push(km_atual); }
      params.push(req.params.id);

      await run(`UPDATE ordens_servico SET ${sets.join(', ')} WHERE id = ?`, params);
      res.json({ ok: true });
    } catch (error) {
      handleError(res, error, 'ordens-servico.status');
    }
  });

  app.delete('/api/ordens-servico/:id', requireRole('admin', 'root'), async (req, res) => {
    try {
      await run('DELETE FROM ordens_servico WHERE id = ?', [req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      handleError(res, error, 'ordens-servico.delete');
    }
  });

  // Dashboard: OS count by status
  app.get('/api/dashboard/ordens-servico', async (req, res) => {
    try {
      const rows = await all(`
        SELECT status, COUNT(*) as total FROM ordens_servico GROUP BY status
      `);
      const map = { aberta: 0, em_andamento: 0, concluida: 0, cancelada: 0 };
      for (const r of rows) map[r.status] = r.total;
      res.json(map);
    } catch (error) {
      handleError(res, error, 'dashboard.ordens-servico');
    }
  });
}

module.exports = { registerOrdensServicoRoutes };
