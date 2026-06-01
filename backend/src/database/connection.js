const { DATABASE_URL } = require('../config');
const isPostgres = Boolean(DATABASE_URL && (DATABASE_URL.startsWith('postgresql://') || DATABASE_URL.startsWith('postgres://')));
const allowSqliteFallback = process.env.DB_FALLBACK_TO_SQLITE === 'true' || (process.env.NODE_ENV !== 'production' && process.env.DB_FALLBACK_TO_SQLITE !== 'false');
const pgDriver = require('./connection-pg');

let activeDriver = isPostgres ? pgDriver : null;
let sqliteDriver = null;
let fallbackApplied = false;

function isConnectionError(error) {
  const code = error?.code || error?.errno || '';
  return ['ECONNREFUSED', 'EHOSTUNREACH', 'ENETUNREACH', 'ETIMEDOUT', 'ECONNRESET', '57P01'].includes(code);
}

function switchToSqlite(error) {
  if (!allowSqliteFallback || !isPostgres || fallbackApplied) return false;
  if (!isConnectionError(error)) return false;

  if (!sqliteDriver) {
    sqliteDriver = require('./connection-sqlite');
  }

  fallbackApplied = true;
  activeDriver = sqliteDriver;
  console.warn('PostgreSQL indisponível; usando SQLite como fallback para evitar falha de login.', error.message || error);
  return true;
}

function getCurrentDriver() {
  if (!activeDriver) {
    if (!sqliteDriver) {
      sqliteDriver = require('./connection-sqlite');
    }
    activeDriver = sqliteDriver;
  }
  return activeDriver;
}

function withFallback(operation, ...args) {
  const driver = getCurrentDriver();

  return Promise.resolve()
    .then(() => operation(driver, ...args))
    .catch((error) => {
      if (switchToSqlite(error)) {
        return operation(getCurrentDriver(), ...args);
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

function getActiveDbName() {
  if (fallbackApplied) return 'sqlite';
  return isPostgres ? 'postgres' : 'sqlite';
}

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

function sqlDate(expression) {
  // expression: 'now', '?', "?, '+7 days'", etc.
  if (isPostgres) {
    if (expression === 'now') return 'CURRENT_DATE';
    if (expression.includes("'+")) {
      // e.g., "?, '+7 days'" -> "?::date + INTERVAL '7 days'"
      const parts = expression.match(/\?,\s*'\+(\d+)\s+(\w+)'/);
      if (parts) {
        return `?::date + INTERVAL '${parts[1]} ${parts[2]}'`;
      }
    }
    return expression.replace('?', '?::date');
  }
  // SQLite
  return `date(${expression})`;
}


module.exports = { run, all, get, query, parseBoolean, parseInteger, seedIfMissing, closeDb, getDb, isPostgres, getActiveDbName, sqlDate };
