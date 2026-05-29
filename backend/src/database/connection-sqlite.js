const sqlite3 = require('sqlite3');
const { DB_PATH } = require('../config');

let db;

function getDb() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (error) => {
      if (error) {
        console.error('SQLite open error:', error.message || error);
      }
    });
  }
  return db;
}

function closeDb() {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve();
      return;
    }

    db.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      db = null;
      resolve();
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function runCallback(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        lastID: this.lastID,
        changes: this.changes,
        rowCount: this.changes,
        rows: [],
      });
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(rows || []);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(row || null);
    });
  });
}

function query(sql, params = []) {
  return run(sql, params);
}

async function seedIfMissing(sql, params = []) {
  try {
    await run(sql, params);
  } catch (error) {
    console.warn('Seed skip or error', error.message || error);
  }
}

module.exports = { run, all, get, query, seedIfMissing, closeDb, getDb };
