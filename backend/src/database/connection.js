const sqlite3 = require('sqlite3').verbose();
const { DB_PATH } = require('../config');

function openDb() {
  const db = new sqlite3.Database(DB_PATH);
  db.run('PRAGMA foreign_keys = ON');
  return db;
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
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

async function seedIfMissing(db, sql, params = []) {
  try {
    await run(db, sql, params);
  } catch (error) {
    console.warn('Seed skip or error', error.message || error);
  }
}

module.exports = { openDb, run, all, get, parseBoolean, parseInteger, seedIfMissing };
