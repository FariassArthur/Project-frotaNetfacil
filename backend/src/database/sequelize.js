const { Sequelize } = require('sequelize');

const { DATABASE_URL } = require('../config');

const isPostgres = Boolean(DATABASE_URL && (DATABASE_URL.startsWith('postgresql://') || DATABASE_URL.startsWith('postgres://')));

if (!isPostgres) {
  throw new Error('FATAL: DATABASE_URL is required and must start with postgresql://. PostgreSQL is the only supported database.');
}

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  pool: {
    max: 15,
    min: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  },
  dialectOptions: process.env.PG_SSL === 'true' ? {
    ssl: {
      rejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED !== 'false',
      ...(process.env.PG_SSL_CA ? { ca: require('fs').readFileSync(process.env.PG_SSL_CA) } : {}),
    },
  } : {},
});

async function authenticate() {
  await sequelize.authenticate();
  console.log('PostgreSQL connected via Sequelize');
}

function getActiveDbName() {
  return 'postgres';
}

module.exports = { sequelize, authenticate, getActiveDbName, isPostgres: true };
