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
  ? (process.env.DATABASE_URL || buildDatabaseUrl())
  : (process.env.DATABASE_URL || buildDatabaseUrl());

if (!DATABASE_URL) {
  throw new Error('FATAL: PostgreSQL connection URL is required. Set DATABASE_URL or PGHOST/PGDATABASE/PGUSER.');
}

const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const UPLOADS_BASE = path.resolve(process.env.UPLOADS_BASE || path.join(PUBLIC_DIR, 'uploads'));

fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_BASE, { recursive: true });

module.exports = { PORT, JWT_SECRET, ROOT_DIR, DATABASE_URL, PUBLIC_DIR, UPLOADS_BASE, CORS_ORIGIN: process.env.CORS_ORIGIN || '', NODE_ENV };
