const crypto = require('crypto');
const { run, all } = require('../database/connection');

const CLEANUP_INTERVAL = 60 * 60 * 1000;
let cleanupTimer = null;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function extractExp(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return decoded.exp || 0;
  } catch {
    return 0;
  }
}

async function add(token) {
  const tokenHash = hashToken(token);
  const exp = extractExp(token);
  const expiresAt = exp * 1000;
  try {
    await run(
      'INSERT OR IGNORE INTO token_blacklist (token_hash, expires_at) VALUES (?, ?)',
      [tokenHash, expiresAt]
    );
  } catch (err) {
    console.error('TokenBlacklist add error:', err.message || err);
  }
}

async function isBlacklisted(token) {
  if (!token) return false;
  const tokenHash = hashToken(token);
  try {
    const row = await all('SELECT 1 FROM token_blacklist WHERE token_hash = ?', [tokenHash]);
    return row.length > 0;
  } catch {
    return false;
  }
}

async function cleanup() {
  try {
    const now = Date.now();
    await run('DELETE FROM token_blacklist WHERE expires_at < ?', [now]);
  } catch (err) {
    console.error('TokenBlacklist cleanup error:', err.message || err);
  }
}

function startCleanup() {
  stopCleanup();
  cleanupTimer = setInterval(cleanup, CLEANUP_INTERVAL);
  cleanup();
}

function stopCleanup() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

module.exports = { add, isBlacklisted, cleanup, startCleanup, stopCleanup };
