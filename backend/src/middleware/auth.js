const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET } = require('../config');
const { openDb, get } = require('../database/connection');

const verifyAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader) {
    return res.status(401).json({ error: 'Autorização requerida' });
  }
  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    // fallback to legacy base64 username:password
  }

  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const [username, password] = decoded.split(':');
    if (!username || !password) return res.status(401).json({ error: 'Token inválido' });
    const db = openDb();
    const user = await get(db, 'SELECT id, username, role, ativo, password FROM usuarios WHERE username = ?', [username]);
    db.close();
    if (!user) return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    if (!user.ativo) return res.status(403).json({ error: 'Usuário inativo' });
    req.user = { id: user.id, username: user.username, role: user.role };
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = { verifyAuth };
