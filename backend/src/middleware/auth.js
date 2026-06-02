const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { isBlacklisted } = require('../services/tokenBlacklist');

function getTokenFromCookie(req) {
  const raw = req.headers.cookie || '';
  const match = raw.match(/(?:^|;\s*)token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const verifyAuth = async (req, res, next) => {
  let token = getTokenFromCookie(req);

  if (!token) {
    const authHeader = req.headers['authorization'] || '';
    token = authHeader.replace('Bearer ', '').trim();
  }

  if (!token) {
    return res.status(401).json({ error: 'Autorização requerida' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    const blacklisted = await isBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({ error: 'Token revogado' });
    }
    req.user = payload;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autorização requerida' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso restrito' });
    }
    next();
  };
};

module.exports = { verifyAuth, requireRole };
