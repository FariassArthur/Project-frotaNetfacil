const crypto = require('crypto');
const { Op } = require('sequelize');
const { TokenBlacklist } = require('../database/models');

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
    await TokenBlacklist.findOrCreate({
      where: { token_hash: tokenHash },
      defaults: { token_hash: tokenHash, expires_at: expiresAt },
    });
  } catch (err) {
    console.error('TokenBlacklist add error:', err.message || err);
  }
}

async function isBlacklisted(token) {
  if (!token) return false;
  const tokenHash = hashToken(token);
  try {
    const row = await TokenBlacklist.findByPk(tokenHash);
    return row !== null;
  } catch {
    return false;
  }
}

async function cleanup() {
  try {
    await TokenBlacklist.destroy({
      where: { expires_at: { [Op.lt]: Date.now() } },
    });
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
