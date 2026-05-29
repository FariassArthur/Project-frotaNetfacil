const { DATABASE_URL } = require('../config');

const isPostgres = DATABASE_URL && (DATABASE_URL.startsWith('postgresql://') || DATABASE_URL.startsWith('postgres://'));
const pgDriver = require('./connection-pg');
const sqliteDriver = require('./connection-sqlite');
const allowSqliteFallback = process.env.DB_FALLBACK_TO_SQLITE !== 'false';

let activeDriver = isPostgres ? pgDriver : sqliteDriver;
let fallbackApplied = false;

function isConnectionError(error) {
  const code = error?.code || error?.errno || '';
  return ['ECONNREFUSED', 'EHOSTUNREACH', 'ENETUNREACH', 'ETIMEDOUT', 'ECONNRESET', '57P01'].includes(code);
}

function switchToSqlite(error) {
  if (!allowSqliteFallback || !isPostgres || fallbackApplied) return false;
  if (!isConnectionError(error)) return false;

  fallbackApplied = true;
  activeDriver = sqliteDriver;
  console.warn('PostgreSQL indisponível; usando SQLite como fallback para evitar falha de login.', error.message || error);
  return true;
}

function withFallback(operation, ...args) {
  return Promise.resolve()
    .then(() => operation(activeDriver, ...args))
    .catch((error) => {
      if (switchToSqlite(error)) {
        return operation(activeDriver, ...args);
      }
      throw error;
    });
}

const run = (...args) => withFallback((driver, sql, params) => driver.run(sql, params), ...args);
const all = (...args) => withFallback((driver, sql, params) => driver.all(sql, params), ...args);
const get = (...args) => withFallback((driver, sql, params) => driver.get(sql, params), ...args);
const query = (...args) => withFallback((driver, sql, params) => driver.query(sql, params), ...args);
const closeDb = () => activeDriver.closeDb?.() || Promise.resolve();
const getDb = () => activeDriver.getDb?.() || activeDriver.getPool?.() || null;

function parseBoolean(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

function parseInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

async function seedIfMissing(sql, params = []) {
  try {
    await run(sql, params);
  } catch (error) {
    console.warn('Seed skip or error', error.message || error);
  }
}

module.exports = { run, all, get, query, parseBoolean, parseInteger, seedIfMissing, closeDb, getDb, isPostgres };
