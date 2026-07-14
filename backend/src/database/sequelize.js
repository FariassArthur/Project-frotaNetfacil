const { Sequelize } = require('sequelize');
const path = require('path');

const { DATABASE_URL } = require('../config');

const isPostgres = Boolean(DATABASE_URL && (DATABASE_URL.startsWith('postgresql://') || DATABASE_URL.startsWith('postgres://')));
const allowSqliteFallback = process.env.DB_FALLBACK_TO_SQLITE === 'true' || (process.env.NODE_ENV !== 'production' && process.env.DB_FALLBACK_TO_SQLITE !== 'false');
const DB_PATH = process.env.DB_PATH === ':memory:'
  ? ':memory:'
  : path.resolve(process.env.DB_PATH || path.join(path.resolve(__dirname, '..', '..'), 'data', 'gestaofrota.sqlite'));

let sequelize;
let isSqliteFallback = false;

if (isPostgres) {
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    pool: { max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000 },
    dialectOptions: process.env.PG_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {},
  });
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: DB_PATH,
    logging: false,
  });
}

async function authenticate() {
  try {
    await sequelize.authenticate();
    if (isPostgres) {
      console.log('PostgreSQL connected via Sequelize');
    } else {
      console.log('SQLite connected via Sequelize');
    }
  } catch (error) {
    if (isPostgres && allowSqliteFallback) {
      console.warn('PostgreSQL unavailable, falling back to SQLite via Sequelize:', error.message);
      sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: DB_PATH,
        logging: false,
      });
      isSqliteFallback = true;
      await sequelize.authenticate();
      console.log('SQLite fallback connected via Sequelize');
    } else {
      throw error;
    }
  }
}

function getActiveDbName() {
  if (isSqliteFallback) return 'sqlite';
  return isPostgres ? 'postgres' : 'sqlite';
}

module.exports = { sequelize, authenticate, getActiveDbName, isPostgres };
