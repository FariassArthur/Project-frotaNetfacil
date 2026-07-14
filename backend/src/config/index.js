require('dotenv').config();
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const NODE_ENV = process.env.NODE_ENV || 'development';

function requireEnv(name, defaultValue) {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`FATAL: Environment variable ${name} is required but not set.`);
  }
  return value || defaultValue;
}

const PORT = Number(process.env.PORT) || 3001;
const JWT_SECRET = requireEnv('JWT_SECRET', NODE_ENV === 'production' ? undefined : 'dev-only-jwt-secret-change-me');
if (!process.env.JWT_SECRET && NODE_ENV === 'production') {
  throw new Error('FATAL: Environment variable JWT_SECRET is required in production.');
}
const DB_PATH = path.resolve(process.env.DB_PATH || path.join(ROOT_DIR, 'data', 'gestaofrota.sqlite'));

function buildDatabaseUrl() {
  const host = process.env.PGHOST || process.env.DB_HOST;
  const port = process.env.PGPORT || process.env.DB_PORT || '5432';
  const name = process.env.PGDATABASE || process.env.DB_NAME;
  const user = process.env.PGUSER || process.env.DB_USER;
  const password = process.env.PGPASSWORD || process.env.DB_PASSWORD || '';

  if (!host || !name || !user) {
    return '';
  }

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
}

const DATABASE_URL = NODE_ENV === 'test'
  ? ''
  : (process.env.DATABASE_URL || buildDatabaseUrl());
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const UPLOADS_BASE = path.resolve(process.env.UPLOADS_BASE || path.join(PUBLIC_DIR, 'uploads'));
const CORS_ORIGIN = NODE_ENV === 'production'
  ? (process.env.CORS_ORIGIN || '')
  : (process.env.CORS_ORIGIN || 'http://localhost:4173');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_BASE, { recursive: true });

module.exports = { PORT, JWT_SECRET, ROOT_DIR, DB_PATH, DATABASE_URL, PUBLIC_DIR, UPLOADS_BASE, CORS_ORIGIN, NODE_ENV };
