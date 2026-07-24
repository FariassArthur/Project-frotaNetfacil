require('dotenv/config');
const app = require('./app');
const { PORT, NODE_ENV } = require('./config');
const { sequelize, authenticate } = require('./database/sequelize');
const { startCron, stopCron } = require('./services/cron');
const { startCleanup: startTokenCleanup, stopCleanup: stopTokenCleanup } = require('./services/tokenBlacklist');
const { Umzug } = require('umzug');

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

async function runMigrations() {
  const umzug = new Umzug({
    sequelize,
    path: require('path').resolve(__dirname, 'database', 'migrations'),
    pattern: /\.js$/,
    storage: {
      async executed() {
        const [results] = await sequelize.query(
          "SELECT name FROM sequeliZemeta WHERE name LIKE '%.js' ORDER BY name"
        );
        return results.map((r) => r.name);
      },
      async logMigration({ name }) {
        await sequelize.query(
          `INSERT INTO sequeliZemeta (name, "createdAt") VALUES (?, NOW())`,
          { replacements: [name] }
        );
      },
      async unlogMigration({ name }) {
        await sequelize.query(
          `DELETE FROM sequeliZemeta WHERE name = ?`,
          { replacements: [name] }
        );
      },
    },
    context: { queryInterface: sequelize.getQueryInterface(), Sequelize: require('sequelize') },
    migrations: { glob: '*.js', resolve: ({ name, path, context }) => require(path) },
  });

  await umzug.up();
}

authenticate()
  .then(async () => {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "sequeliZemeta" (
        "name" VARCHAR(255) PRIMARY KEY,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('Running migrations...');
    await runMigrations();
    console.log('Migrations completed successfully.');
  })
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`FrotaNetFacil backend running on http://localhost:${PORT}`);
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
