const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    const { DATABASE_URL } = require('../config');
    const ssl = process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : undefined;

    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err.message || err);
    });
  }
  return pool;
}

async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

function convertParams(sql, params) {
  if (!params || params.length === 0) return [sql, params];
  let idx = 0;
  const converted = sql.replace(/\?/g, () => `$${++idx}`);
  return [converted, params];
}

function run(sql, params = []) {
  const [qs, qp] = convertParams(sql, params);
  return getPool().query(qs, qp).then((res) => ({
    lastID: res.rows[0]?.id || null,
    changes: res.rowCount,
    rowCount: res.rowCount,
    rows: res.rows,
  }));
}

function all(sql, params = []) {
  const [qs, qp] = convertParams(sql, params);
  return getPool().query(qs, qp).then((res) => res.rows);
}

function get(sql, params = []) {
  const [qs, qp] = convertParams(sql, params);
  return getPool().query(qs, qp).then((res) => res.rows[0] || null);
}

function query(sql, params = []) {
  return run(sql, params);
}

module.exports = { run, all, get, query, closeDb, getPool };
