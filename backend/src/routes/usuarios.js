const bcrypt = require('bcryptjs');
const { openDb, run, get, all } = require('../database/connection');

const SENSITIVE_FIELDS = ['password'];

function registerUsuariosRoutes(app) {
  app.get('/api/usuarios', async (req, res) => {
    const db = openDb();
    try {
      const rows = await all(db, 'SELECT id, username, role, ativo, permissoes FROM usuarios ORDER BY username');
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });

  app.get('/api/usuarios/:id', async (req, res) => {
    const db = openDb();
    try {
      const row = await get(db, 'SELECT id, username, role, ativo, permissoes FROM usuarios WHERE id = ?', [req.params.id]);
      if (!row) return res.status(404).json({ error: 'Usuário não encontrado' });
      res.json(row);
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });

  app.post('/api/usuarios', async (req, res) => {
    const db = openDb();
    const { username, password, role, ativo, permissoes } = req.body || {};
    try {
      if (!username || !password) return res.status(400).json({ error: 'username e password são obrigatórios' });
      const hash = await bcrypt.hash(password, 10);
      const result = await run(
        db,
        'INSERT INTO usuarios (username, password, role, ativo, permissoes) VALUES (?, ?, ?, ?, ?)',
        [username, hash, role || 'user', ativo !== false ? 1 : 0, permissoes || 'all']
      );
      res.status(201).json({ ok: true, id: result.lastID });
    } catch (error) {
      if (error.message && error.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Username já existe' });
      }
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });

  app.put('/api/usuarios/:id', async (req, res) => {
    const db = openDb();
    const { username, password, role, ativo, permissoes } = req.body || {};
    try {
      const exists = await get(db, 'SELECT id FROM usuarios WHERE id = ?', [req.params.id]);
      if (!exists) return res.status(404).json({ error: 'Usuário não encontrado' });

      const updates = [];
      const params = [];

      if (username !== undefined) { updates.push('username = ?'); params.push(username); }
      if (role !== undefined) { updates.push('role = ?'); params.push(role); }
      if (ativo !== undefined) { updates.push('ativo = ?'); params.push(ativo ? 1 : 0); }
      if (permissoes !== undefined) { updates.push('permissoes = ?'); params.push(permissoes); }
      if (password !== undefined && password !== '') {
        const hash = await bcrypt.hash(password, 10);
        updates.push('password = ?');
        params.push(hash);
      }

      if (updates.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

      params.push(req.params.id);
      await run(db, `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`, params);
      res.json({ ok: true });
    } catch (error) {
      if (error.message && error.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Username já existe' });
      }
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });

  app.delete('/api/usuarios/:id', async (req, res) => {
    const db = openDb();
    try {
      const user = await get(db, 'SELECT role FROM usuarios WHERE id = ?', [req.params.id]);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
      if (user.role === 'root') return res.status(403).json({ error: 'Não é possível excluir o usuário root' });
      await run(db, 'DELETE FROM usuarios WHERE id = ?', [req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });
}

module.exports = { registerUsuariosRoutes };
