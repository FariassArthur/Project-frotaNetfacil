const sqlite3 = require('sqlite3').verbose();
const { DB_PATH } = require('../config');
const fs = require('fs');
const path = require('path');

let db;

function getDb() {
  if (!db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new sqlite3.Database(DB_PATH);
    db.run('PRAGMA foreign_keys = ON');
    db.run('PRAGMA journal_mode = WAL');
  }
  return db;
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes, rowCount: this.changes, rows: this.lastID != null ? [{ id: this.lastID }] : [] });
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function query(sql, params = []) {
  return run(sql, params);
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

module.exports = { run, all, get, query, parseBoolean, parseInteger, seedIfMissing };
