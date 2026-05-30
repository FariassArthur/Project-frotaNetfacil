const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const DB_NAME = process.env.PGDATABASE || process.env.DB_NAME || 'frotadb';
const DB_USER = process.env.PGUSER || process.env.DB_USER || 'postgres';
const DB_PASS = process.env.PGPASSWORD || process.env.DB_PASSWORD || 'n3tNOC';

async function setup() {
  const admin = new Client({
    host: process.env.PGHOST || process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.PGPORT || process.env.DB_PORT || 5432),
    user: 'postgres',
    database: 'postgres',
  });

  await admin.connect();

  const exists = await admin.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`, [DB_NAME]
  );

  if (exists.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${DB_NAME}"`);
    console.log(`Banco "${DB_NAME}" criado.`);
  } else {
    console.log(`Banco "${DB_NAME}" já existe.`);
  }

  await admin.query(`ALTER USER "${DB_USER}" WITH PASSWORD '${DB_PASS.replace(/'/g, "''")}'`);
  console.log(`Senha do usuário "${DB_USER}" atualizada.`);

  await admin.end();
  console.log('Setup PostgreSQL concluído.');
}

setup().catch(err => {
  console.error('Erro no setup:', err.message);
  process.exit(1);
});
