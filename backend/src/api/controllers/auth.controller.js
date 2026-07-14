const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../config');
const { Usuario } = require('../../database/models');
const { logAudit } = require('../../services/auditLog');
const { handleError } = require('../../services/errorHandler');
const { add: blacklistToken } = require('../../services/tokenBlacklist');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;
const loginAttempts = new Map();

function isLockedOut(username) {
  const record = loginAttempts.get(username);
  if (!record) return false;
  if (record.count >= MAX_LOGIN_ATTEMPTS && Date.now() - record.firstAttempt < LOCKOUT_DURATION) return true;
  if (Date.now() - record.firstAttempt >= LOCKOUT_DURATION) { loginAttempts.delete(username); return false; }
  return false;
}

function recordFailedAttempt(username) {
  const now = Date.now();
  const record = loginAttempts.get(username);
  if (!record || (now - record.firstAttempt) >= LOCKOUT_DURATION) {
    loginAttempts.set(username, { count: 1, firstAttempt: now });
  } else {
    loginAttempts.set(username, { count: record.count + 1, firstAttempt: record.firstAttempt });
  }
}

function clearAttempts(username) {
  loginAttempts.delete(username);
}

async function login(req, res) {
  const { username, password } = req.body || {};
  try {
    if (!username || !password) return res.status(400).json({ error: 'username e password são obrigatórios' });
    if (isLockedOut(username)) return res.status(429).json({ error: 'Conta temporariamente bloqueada. Tente novamente em 15 minutos.' });
    const user = await Usuario.findOne({ where: { username } });
    if (!user) { recordFailedAttempt(username); return res.status(401).json({ error: 'Usuário ou senha inválidos' }); }
    if (!user.ativo) return res.status(403).json({ error: 'Usuário inativo' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) { recordFailedAttempt(username); return res.status(401).json({ error: 'Usuário ou senha inválidos' }); }
    clearAttempts(username);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h', algorithm: 'HS256' }
    );

    const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https' || req.protocol === 'https';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? 'strict' : 'lax',
      maxAge: SESSION_TTL_MS,
      path: '/',
    });

    res.json({
      ok: true,
      user: { id: user.id, username: user.username, role: user.role, permissoes: user.permissoes },
    });

    logAudit({
      user_id: user.id, username: user.username, acao: 'login', entidade: 'Sistema',
      entidade_id: String(user.id), descricao: `Usuário ${user.username} fez login`, ip: req.ip,
    }).catch(err => console.error('Audit log error:', err));
  } catch (error) { handleError(res, error, 'auth'); }
}

async function me(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  res.json({ id: req.user.id, username: req.user.username, role: req.user.role });
}

async function logout(req, res) {
  const authHeader = req.headers['authorization'] || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const cookieToken = (() => {
    const raw = req.headers.cookie || '';
    const m = raw.match(/(?:^|;\s*)token=([^;]*)/);
    return m ? decodeURIComponent(m[1]) : null;
  })();
  const token = bearerToken || cookieToken;
  const isSecure = req.headers['x-forwarded-proto'] === 'https' || req.protocol === 'https';
  if (token) await blacklistToken(token);
  res.clearCookie('token', { path: '/', httpOnly: true, secure: isSecure, sameSite: isSecure ? 'strict' : 'lax' });
  res.json({ ok: true });
  if (req.user) {
    logAudit({
      user_id: req.user.id, username: req.user.username, acao: 'logout', entidade: 'Sistema',
      entidade_id: String(req.user.id), descricao: `Usuário ${req.user.username} fez logout`, ip: req.ip,
    }).catch(err => console.error('Audit log error:', err));
  }
}

module.exports = { login, me, logout };
