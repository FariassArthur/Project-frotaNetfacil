const bcrypt = require('bcryptjs');
const { openDb, run, all, seedIfMissing } = require('./connection');

async function initDb() {
  const db = openDb();

  await run(db, `
    CREATE TABLE IF NOT EXISTS combustiveis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL UNIQUE
    )
  `);

  await run(db, `
    CREATE TABLE IF NOT EXISTS veiculos (
      placa TEXT PRIMARY KEY,
      tipo TEXT,
      fipe_name_marca TEXT,
      fipe_modelo TEXT,
      fipe_name_ano TEXT,
      renavam TEXT,
      chassi TEXT,
      combustivel INTEGER,
      ano_fab TEXT,
      ano_modelo TEXT,
      capacidade TEXT,
      cor TEXT,
      cidade TEXT,
      uf TEXT,
      cpfcnpj TEXT,
      categoria TEXT,
      km INTEGER,
      nome_endereco TEXT,
      data_aquisicao TEXT,
      observacao TEXT,
      potencia TEXT,
      culture_info TEXT,
      medidas_pneus TEXT,
      codigo_postal TEXT,
      path_documento_pdf TEXT,
      data_vencimento_ipva TEXT,
      ativo INTEGER
    )
  `);

  await run(db, `
    CREATE TABLE IF NOT EXISTS cnhs (
      numero_registro TEXT PRIMARY KEY,
      nome TEXT,
      nascimento TEXT,
      categoria TEXT,
      cpf TEXT,
      filiacao TEXT,
      primeira_habilitacao TEXT,
      emissao TEXT,
      validade TEXT,
      local TEXT,
      path_documento_pdf TEXT,
      aivo INTEGER
    )
  `);

  try {
    const cols = await all(db, "PRAGMA table_info('cnhs')");
    const hasVeiculo = cols.some((c) => c.name === 'veiculo_id');
    if (!hasVeiculo) {
      await run(db, `ALTER TABLE cnhs ADD COLUMN veiculo_id TEXT`);
    }
  } catch (err) {
    console.warn('Could not ensure cnhs.veiculo_id column', err.message || err);
  }

  await run(db, `
    CREATE TABLE IF NOT EXISTS mecanicas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      endereco TEXT,
      numero TEXT,
      complemento TEXT,
      cep TEXT,
      bairro TEXT,
      cidade TEXT,
      uf TEXT,
      site TEXT,
      email TEXT,
      telefone1 TEXT,
      telefone2 TEXT,
      celular1 TEXT,
      celular1_operadora TEXT,
      celular2 TEXT,
      celular2_operadora TEXT,
      contatos TEXT,
      observacao TEXT
    )
  `);

  await run(db, `
    CREATE TABLE IF NOT EXISTS tipo_manutencao (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao TEXT
    )
  `);

  await run(db, `
    CREATE TABLE IF NOT EXISTS manutencoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT,
      data_s TEXT,
      valor REAL,
      descricao TEXT,
      km INTEGER,
      classificacao TEXT DEFAULT 'preventiva',
      path_comprovante_pdf TEXT,
      veiculo_id TEXT,
      mecanica_id INTEGER,
      tipo_manutencao_id INTEGER,
      FOREIGN KEY (veiculo_id) REFERENCES veiculos(placa) ON DELETE CASCADE,
      FOREIGN KEY (mecanica_id) REFERENCES mecanicas(id) ON DELETE SET NULL,
      FOREIGN KEY (tipo_manutencao_id) REFERENCES tipo_manutencao(id) ON DELETE SET NULL
    )
  `);

  try {
    const cols = await all(db, "PRAGMA table_info('manutencoes')");
    if (!cols.some((c) => c.name === 'classificacao')) {
      await run(db, `ALTER TABLE manutencoes ADD COLUMN classificacao TEXT DEFAULT 'preventiva'`);
    }
  } catch (err) {
    console.warn('Could not ensure manutencoes.classificacao column', err.message || err);
  }

  await run(db, `
    CREATE TABLE IF NOT EXISTS multas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data_ocorrencia TEXT,
      data_ocorrencia_s TEXT,
      local_ocorrencia TEXT,
      data_vencimento TEXT,
      data_vencimento_s TEXT,
      data_pagamento TEXT,
      data_pagamento_s TEXT,
      valor REAL,
      path_anexo_multa_pdf TEXT,
      pagamento_realizado INTEGER,
      veiculo_id TEXT,
      FOREIGN KEY (veiculo_id) REFERENCES veiculos(placa) ON DELETE CASCADE
    )
  `);

  await run(db, `
    CREATE TABLE IF NOT EXISTS seguradoras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      corretor TEXT,
      endereco TEXT,
      numero TEXT,
      complemento TEXT,
      cep TEXT,
      bairro TEXT,
      cidade TEXT,
      uf TEXT,
      site TEXT,
      email TEXT,
      telefone1 TEXT,
      telefone2 TEXT,
      celular1 TEXT,
      celular1_operadora TEXT,
      celular2 TEXT,
      celular2_operadora TEXT,
      contatos TEXT
    )
  `);

  await run(db, `
    CREATE TABLE IF NOT EXISTS contratos_seguro (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_apolice TEXT,
      data_inicial_contrato TEXT,
      data_final_contrato TEXT,
      ativo INTEGER,
      path_orcamento_pdf TEXT,
      path_contrato_pdf TEXT,
      path_cartao_pdf TEXT,
      seguradora_id INTEGER,
      veiculo_id TEXT,
      FOREIGN KEY (seguradora_id) REFERENCES seguradoras(id) ON DELETE SET NULL,
      FOREIGN KEY (veiculo_id) REFERENCES veiculos(placa) ON DELETE CASCADE
    )
  `);

  await run(db, `
    CREATE TABLE IF NOT EXISTS pagamentos_seguro (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data_pagamento TEXT,
      valor REAL,
      path_pagamento_pdf TEXT,
      contrato_seguro_id INTEGER,
      veiculo_id TEXT,
      FOREIGN KEY (contrato_seguro_id) REFERENCES contratos_seguro(id) ON DELETE CASCADE,
      FOREIGN KEY (veiculo_id) REFERENCES veiculos(placa) ON DELETE CASCADE
    )
  `);

  await run(db, `
    CREATE TABLE IF NOT EXISTS pagamento_documentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data_pagamento TEXT,
      data_pagamento_s TEXT,
      data_vencimento TEXT,
      data_vencimento_s TEXT,
      valor REAL,
      descricao TEXT,
      veiculo_id TEXT,
      FOREIGN KEY (veiculo_id) REFERENCES veiculos(placa) ON DELETE CASCADE
    )
  `);

  await run(db, `
    CREATE TABLE IF NOT EXISTS abastecimentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quantidade REAL,
      combustivel_id INTEGER,
      valor REAL,
      km INTEGER,
      path_comprovante_pdf TEXT,
      data TEXT,
      data_s TEXT,
      veiculo_id TEXT,
      FOREIGN KEY (combustivel_id) REFERENCES combustiveis(id) ON DELETE SET NULL,
      FOREIGN KEY (veiculo_id) REFERENCES veiculos(placa) ON DELETE CASCADE
    )
  `);

  await run(db, `
    CREATE TABLE IF NOT EXISTS versoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT
    )
  `);

  await run(db, `
    CREATE TABLE IF NOT EXISTS configuracoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cod_pais TEXT NOT NULL,
      idioma TEXT NOT NULL,
      culture_info TEXT NOT NULL
    )
  `);

  await run(db, `
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      ativo INTEGER DEFAULT 1,
      permissoes TEXT DEFAULT 'all'
    )
  `);

  try {
    const userCols = await all(db, "PRAGMA table_info('usuarios')");
    if (!userCols.some((c) => c.name === 'permissoes')) {
      await run(db, `ALTER TABLE usuarios ADD COLUMN permissoes TEXT DEFAULT 'all'`);
    }
  } catch (err) {
    console.warn('Could not ensure usuarios.permissoes column', err.message || err);
  }

  await seedIfMissing(db, `INSERT OR IGNORE INTO combustiveis (tipo) VALUES (?), (?), (?), (?), (?), (?), (?), (?), (?), (?)`, [
    'Não definido', 'Gasolina', 'Alcool', 'Flex', 'GNV',
    'Gasolina/GNV', 'Flex/GNV', 'Diesel', 'Tri-Combustivel', 'Diesel/GNV'
  ]);

  await seedIfMissing(db, `INSERT OR IGNORE INTO tipo_manutencao (descricao) VALUES (?), (?), (?), (?)`, [
    'Revisão', 'Troca de óleo', 'Pneus', 'Freios'
  ]);

  await seedIfMissing(db, `INSERT OR IGNORE INTO configuracoes (id, cod_pais, idioma, culture_info) VALUES (1, ?, ?, ?)`, [
    'BR', 'pt-BR', 'pt-BR'
  ]);

  try {
    const adminPassHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin', 10);
    await run(db, `INSERT OR IGNORE INTO usuarios (id, username, password, role, ativo) VALUES (1, ?, ?, ?, 1)`, [
      'admin', adminPassHash, 'root'
    ]);
  } catch (err) {
    console.warn('Could not seed admin user', err.message || err);
  }

  await run(db, `INSERT OR IGNORE INTO versoes (id, version) VALUES (1, ?);`, [
    process.env.npm_package_version || '1.0.0'
  ]);

  db.close();
}

module.exports = { initDb };
