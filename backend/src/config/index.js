const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const DB_PATH = process.env.DB_PATH || path.join(ROOT_DIR, 'data', 'gestaofrota.sqlite');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const UPLOADS_BASE = process.env.UPLOADS_BASE || path.join(PUBLIC_DIR, 'uploads');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_BASE, { recursive: true });

module.exports = { PORT, JWT_SECRET, ROOT_DIR, DB_PATH, PUBLIC_DIR, UPLOADS_BASE };
