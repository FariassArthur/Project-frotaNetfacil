function buildDatabaseUrl() {
  const host = process.env.PGHOST || process.env.DB_HOST;
  const port = process.env.PGPORT || process.env.DB_PORT || '5432';
  const name = process.env.PGDATABASE || process.env.DB_NAME;
  const user = process.env.PGUSER || process.env.DB_USER;
  const password = process.env.PGPASSWORD || process.env.DB_PASSWORD || '';

  if (!host || !name || !user) {
    return '';
  }

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
}

const DATABASE_URL = process.env.DATABASE_URL || buildDatabaseUrl();

const baseConfig = {
  url: DATABASE_URL,
  dialect: 'postgres',
  logging: false,
  dialectOptions: process.env.PG_SSL === 'true' ? {
    ssl: {
      rejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED !== 'false',
    },
  } : {},
};

module.exports = {
  development: { ...baseConfig },
  test: {
    url: DATABASE_URL,
    dialect: 'postgres',
    logging: false,
  },
  production: { ...baseConfig },
};
