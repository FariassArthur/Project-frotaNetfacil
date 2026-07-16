const path = require('path');

const DB_PATH = process.env.DB_PATH === ':memory:'
  ? ':memory:'
  : path.resolve(process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'gestaofrota.sqlite'));

const DATABASE_URL = process.env.DATABASE_URL;

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: DB_PATH,
    logging: false,
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  },
  production: {
    ...(DATABASE_URL
      ? {
          url: DATABASE_URL,
          dialect: 'postgres',
          logging: false,
          dialectOptions: process.env.PG_SSL === 'true' ? {
            ssl: {
              rejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED !== 'false',
            },
          } : {},
        }
      : {
          dialect: 'sqlite',
          storage: DB_PATH,
          logging: false,
        }),
  },
};
