const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { get } = require('../database/connection');
const { logAudit } = require('../services/auditLog');
const { handleError } = require('../services/errorHandler');

function registerAuthRoutes(app) {
  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body || {};
    try {
      if (!username || !password) {
        return res.status(400).json({ error: 'username e password são obrigatórios' });
      }
      const user = await get('SELECT id, username, role, ativo, permissoes, password FROM usuarios WHERE username = ?', [username]);
      if (!user) {
        return res.status(401).json({ error: 'Usuário ou senha inválidos' });
      }
      if (!user.ativo) {
        return res.status(403).json({ error: 'Usuário inativo' });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ error: 'Usuário ou senha inválidos' });

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '8h', algorithm: 'HS256' }
      );

      const ONE_DAY = 24 * 60 * 60 * 1000;
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: ONE_DAY,
        path: '/',
      });

      res.json({
        ok: true,
        token,
        user: { id: user.id, username: user.username, role: user.role, permissoes: user.permissoes },
      });

      logAudit({
        user_id: user.id,
        username: user.username,
        acao: 'login',
        entidade: 'Sistema',
        entidade_id: String(user.id),
        descricao: `Usuário ${user.username} fez login`,
        ip: req.ip,
      }).catch(() => {});
    } catch (error) {
      handleError(res, error, 'auth');
    }
  });

  app.get('/api/me', async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    res.json({
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
    });
  });

  app.post('/api/logout', async (req, res) => {
    res.clearCookie('token', { path: '/' });
    res.json({ ok: true });

    if (req.user) {
      logAudit({
        user_id: req.user.id,
        username: req.user.username,
        acao: 'logout',
        entidade: 'Sistema',
        entidade_id: String(req.user.id),
        descricao: `Usuário ${req.user.username} fez logout`,
        ip: req.ip,
      }).catch(() => {});
    }
  });
}

module.exports = { registerAuthRoutes };
