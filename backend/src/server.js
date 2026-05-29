require('dotenv/config');
const app = require('./app');
const { PORT } = require('./config');
const { initDb } = require('./database/schema');
const { closeDb } = require('./database/connection');

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

function shutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  closeDb()
    .then(() => {
      console.log('Database connection closed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error during shutdown:', err.message || err);
      process.exit(1);
    });
}

initDb()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`GestaoFrota backend running on http://localhost:${PORT}`);
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
