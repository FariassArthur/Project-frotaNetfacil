const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET not set. Using auto-generated fallback. Tokens invalidated on restart.');
}

const DB_PATH = process.env.DB_PATH || path.join(ROOT_DIR, 'data', 'gestaofrota.sqlite');
const DATABASE_URL = process.env.DATABASE_URL; // kept for future PostgreSQL switch
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const UPLOADS_BASE = process.env.UPLOADS_BASE || path.join(PUBLIC_DIR, 'uploads');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_BASE, { recursive: true });

module.exports = { PORT, JWT_SECRET, ROOT_DIR, DB_PATH, DATABASE_URL, PUBLIC_DIR, UPLOADS_BASE };
