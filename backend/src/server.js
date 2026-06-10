require('dotenv/config');
const app = require('./app');
const { PORT } = require('./config');
const { sequelize, authenticate } = require('./database/sequelize');
const { startCron, stopCron } = require('./services/cron');
const { startCleanup: startTokenCleanup, stopCleanup: stopTokenCleanup } = require('./services/tokenBlacklist');

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason instanceof Error ? reason.stack : reason);
});

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error.stack || error);
  process.exit(1);
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

async function shutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  stopCron();
  stopTokenCleanup();
  try {
    await sequelize.close();
    console.log('Database connection closed.');
  } catch (err) {
    console.error('Error during shutdown:', err.message || err);
  }
  process.exit(0);
}

authenticate()
  .then(() => sequelize.sync())
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Zênite backend running on http://localhost:${PORT}`);
      startCron();
      startTokenCleanup();
    });

    server.on('error', (err) => {
      console.error('Server error:', err.message || err);
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error('DB init failed:', error);
    process.exit(1);
  });
