const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { openDb, get } = require('../database/connection');

function registerAuthRoutes(app) {
  app.post('/api/login', async (req, res) => {
    const db = openDb();
    const { username, password } = req.body || {};
    try {
      if (!username || !password) {
        return res.status(400).json({ error: 'username e password são obrigatórios' });
      }
      const user = await get(db, 'SELECT id, username, role, ativo, permissoes, password FROM usuarios WHERE username = ?', [username]);
      if (!user) {
        return res.status(401).json({ error: 'Usuário ou senha inválidos' });
      }
      if (!user.ativo) {
        return res.status(403).json({ error: 'Usuário inativo' });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ error: 'Usuário ou senha inválidos' });

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
      res.json({ ok: true, token, user: { id: user.id, username: user.username, role: user.role, permissoes: user.permissoes } });
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });
}

module.exports = { registerAuthRoutes };
