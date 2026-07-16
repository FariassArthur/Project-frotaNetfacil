require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '..', 'data', 'gestaofrota.sqlite');
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'n3t@NOC$2024';
const ADMIN_ROLE = process.env.ADMIN_ROLE || 'root';

function query(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function seed() {
  console.log(`Banco: ${DB_PATH}`);
  const db = new sqlite3.Database(DB_PATH);

  const tableCheck = await query(db,
    "SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios'"
  );

  if (tableCheck.length === 0) {
    console.error('Tabela "usuarios" não existe. Execute as migrações primeiro.');
    db.close();
    process.exit(1);
  }

  const existing = await query(db,
    'SELECT id FROM usuarios WHERE username = ?', [ADMIN_USERNAME]
  );

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  if (existing.length > 0) {
    console.log(`Usuário "${ADMIN_USERNAME}" já existe (id=${existing[0].id}). Atualizando senha...`);
    await run(db,
      'UPDATE usuarios SET password = ?, role = ?, ativo = 1 WHERE username = ?',
      [hash, ADMIN_ROLE, ADMIN_USERNAME]
    );
    console.log(`Senha do "${ADMIN_USERNAME}" atualizada com sucesso.`);
  } else {
    const result = await run(db,
      `INSERT INTO usuarios (username, password, role, ativo, permissoes, nome_completo, email, telefone)
       VALUES (?, ?, ?, 1, '', '', '', '')`,
      [ADMIN_USERNAME, hash, ADMIN_ROLE]
    );
    console.log(`Usuário "${ADMIN_USERNAME}" criado com sucesso (id=${result.lastID}, role=${ADMIN_ROLE}).`);
  }

  db.close();
  console.log('Seed concluído.');
}

seed().catch(err => {
  console.error('Erro no seed:', err.message);
  process.exit(1);
});
