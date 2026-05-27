const { openDb, all, get } = require('../database/connection');
const { logAudit } = require('../services/auditLog');

function registerLogsRoutes(app) {
  app.get('/api/logs', async (req, res) => {
    if (!req.user || (req.user.role !== 'root' && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }
    const db = openDb();
    try {
      const { user_id, username, entidade, acao, data_inicio, data_fim, limit, offset } = req.query;
      const conditions = [];
      const params = [];

      if (user_id) { conditions.push('user_id = ?'); params.push(user_id); }
      if (username) { conditions.push('username LIKE ?'); params.push(`%${username}%`); }
      if (entidade) { conditions.push('entidade LIKE ?'); params.push(`%${entidade}%`); }
      if (acao) { conditions.push('acao = ?'); params.push(acao); }
      if (data_inicio) { conditions.push('created_at >= ?'); params.push(data_inicio); }
      if (data_fim) { conditions.push('created_at <= ?'); params.push(data_fim + ' 23:59:59'); }

      const where = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

      const countResult = await get(db, `SELECT COUNT(*) as total FROM logs_auditoria${where}`, params);
      const total = countResult ? countResult.total : 0;

      const limitVal = parseInt(limit) || 50;
      const offsetVal = parseInt(offset) || 0;
      const rows = await all(
        db,
        `SELECT * FROM logs_auditoria${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, limitVal, offsetVal]
      );

      res.json({ data: rows, total });
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });

  app.post('/api/logout', async (req, res) => {
    logAudit({
      user_id: req.user?.id,
      username: req.user?.username,
      acao: 'logout',
      entidade: 'Sistema',
      entidade_id: req.user?.id ? String(req.user.id) : null,
      descricao: `Usuário ${req.user?.username || 'desconhecido'} fez logout`,
      ip: req.ip,
    }).catch(() => {});
    res.json({ ok: true });
  });

  app.get('/api/logs/:id', async (req, res) => {
    if (!req.user || (req.user.role !== 'root' && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }
    const db = openDb();
    try {
      const row = await get(db, 'SELECT * FROM logs_auditoria WHERE id = ?', [req.params.id]);
      if (!row) return res.status(404).json({ error: 'Log não encontrado' });
      row.dados_antigos = row.dados_antigos ? JSON.parse(row.dados_antigos) : null;
      row.dados_novos = row.dados_novos ? JSON.parse(row.dados_novos) : null;
      res.json(row);
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });
}

module.exports = { registerLogsRoutes };
