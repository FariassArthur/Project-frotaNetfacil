const bcrypt = require('bcryptjs');
const { run, all, seedIfMissing, isPostgres } = require('./connection');

const AI = isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
const NOW = isPostgres ? 'NOW()' : "datetime('now', 'localtime')";

function insertIgnore(table, columns, valuesCount) {
  if (isPostgres) {
    const vals = columns.map((_, i) => `$${i + 1}`).join(', ');
    return `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${vals}) ON CONFLICT DO NOTHING`;
  }
  const vals = columns.map(() => '?').join(', ');
  return `INSERT OR IGNORE INTO ${table} (${columns.join(', ')}) VALUES (${vals})`;
}

async function getTableColumns(table) {
  if (isPostgres) {
    return all("SELECT column_name FROM information_schema.columns WHERE table_name = $1", [table]);
  }
  return all(`PRAGMA table_info('${table}')`);
}

function hasColumn(cols, name) {
  return cols.some((c) => c.name === name || c.column_name === name);
}

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS combustiveis (
      id ${AI},
      tipo TEXT NOT NULL UNIQUE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS cidades (
      id ${AI},
      nome TEXT NOT NULL UNIQUE,
      uf TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS veiculos (
      placa TEXT PRIMARY KEY,
      numero TEXT,
      tipo TEXT,
      fipe_name_marca TEXT,
      fipe_modelo TEXT,
      fipe_name_ano TEXT,
      renavam TEXT,
      chassi TEXT,
      combustivel INTEGER REFERENCES combustiveis(id) ON DELETE SET NULL,
      ano_fab TEXT,
      ano_modelo TEXT,
      capacidade TEXT,
      cor TEXT,
      cidade TEXT,
      cidade_id INTEGER REFERENCES cidades(id) ON DELETE SET NULL,
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

  await run(`
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
      aivo INTEGER,
      veiculo_id TEXT REFERENCES veiculos(placa) ON DELETE SET NULL,
      path_foto TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS mecanicas (
      id ${AI},
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

  await run(`
    CREATE TABLE IF NOT EXISTS tipo_manutencao (
      id ${AI},
      descricao TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS manutencoes (
      id ${AI},
      data TEXT,
      data_s TEXT,
      valor REAL,
      descricao TEXT,
      km INTEGER,
      classificacao TEXT DEFAULT 'preventiva',
      path_comprovante_pdf TEXT,
      veiculo_id TEXT REFERENCES veiculos(placa) ON DELETE CASCADE,
      mecanica_id INTEGER REFERENCES mecanicas(id) ON DELETE SET NULL,
      tipo_manutencao_id INTEGER REFERENCES tipo_manutencao(id) ON DELETE SET NULL
    )
  `);

  try {
    const cols = await getTableColumns('manutencoes');
    if (!hasColumn(cols, 'classificacao')) {
      await run("ALTER TABLE manutencoes ADD COLUMN classificacao TEXT DEFAULT 'preventiva'");
    }
  } catch (err) {
    console.warn('Could not ensure manutencoes.classificacao column', err.message || err);
  }

  await run(`
    CREATE TABLE IF NOT EXISTS multas (
      id ${AI},
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
      veiculo_id TEXT REFERENCES veiculos(placa) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS seguradoras (
      id ${AI},
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

  await run(`
    CREATE TABLE IF NOT EXISTS contratos_seguro (
      id ${AI},
      numero_apolice TEXT,
      data_inicial_contrato TEXT,
      data_final_contrato TEXT,
      ativo INTEGER,
      path_orcamento_pdf TEXT,
      path_contrato_pdf TEXT,
      path_cartao_pdf TEXT,
      seguradora_id INTEGER REFERENCES seguradoras(id) ON DELETE SET NULL,
      veiculo_id TEXT REFERENCES veiculos(placa) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS pagamentos_seguro (
      id ${AI},
      data_pagamento TEXT,
      valor REAL,
      path_pagamento_pdf TEXT,
      contrato_seguro_id INTEGER REFERENCES contratos_seguro(id) ON DELETE CASCADE,
      veiculo_id TEXT REFERENCES veiculos(placa) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS pagamento_documentos (
      id ${AI},
      data_pagamento TEXT,
      data_pagamento_s TEXT,
      data_vencimento TEXT,
      data_vencimento_s TEXT,
      valor REAL,
      descricao TEXT,
      path_boleto_pdf TEXT,
      path_comprovante_pdf TEXT,
      veiculo_id TEXT REFERENCES veiculos(placa) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS higienizacao (
      id ${AI},
      data TEXT,
      local TEXT,
      valor REAL,
      path_comprovante_pdf TEXT,
      veiculo_id TEXT REFERENCES veiculos(placa) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS cidades (
      id ${AI},
      nome TEXT NOT NULL UNIQUE,
      uf TEXT
    )
  `);

  // Migrate existing cidade text values to cidades table
  try {
    const cols = await getTableColumns('veiculos');
    if (!hasColumn(cols, 'cidade_id')) {
      const veiculos = await all("SELECT DISTINCT cidade FROM veiculos WHERE cidade IS NOT NULL AND cidade != ''");
      for (const v of veiculos) {
        const sql = insertIgnore('cidades', ['nome'], 1);
        await run(sql, [v.cidade]);
      }
      await run('ALTER TABLE veiculos ADD COLUMN cidade_id INTEGER');
      await run('UPDATE veiculos SET cidade_id = (SELECT id FROM cidades WHERE cidades.nome = veiculos.cidade)');
    }
  } catch (err) {
    console.warn('Could not migrate cidade to cidades', err.message || err);
  }

  await run(`
    CREATE TABLE IF NOT EXISTS abastecimentos (
      id ${AI},
      quantidade REAL,
      combustivel_id INTEGER REFERENCES combustiveis(id) ON DELETE SET NULL,
      valor REAL,
      km INTEGER,
      path_comprovante_pdf TEXT,
      data TEXT,
      data_s TEXT,
      veiculo_id TEXT REFERENCES veiculos(placa) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS versoes (
      id ${AI},
      version TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      id ${AI},
      cod_pais TEXT NOT NULL,
      idioma TEXT NOT NULL,
      culture_info TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id ${AI},
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      ativo INTEGER DEFAULT 1,
      permissoes TEXT DEFAULT 'all'
    )
  `);

  try {
    const userCols = await getTableColumns('usuarios');
    if (!hasColumn(userCols, 'permissoes')) {
      await run("ALTER TABLE usuarios ADD COLUMN permissoes TEXT DEFAULT 'all'");
    }
  } catch (err) {
    console.warn('Could not ensure usuarios.permissoes column', err.message || err);
  }

  try {
    const veicCols = await getTableColumns('veiculos');
    if (!hasColumn(veicCols, 'numero')) {
      await run('ALTER TABLE veiculos ADD COLUMN numero TEXT');
    }
  } catch (err) {
    console.warn('Could not ensure veiculos.numero column', err.message || err);
  }

  try {
    const pagDocCols = await getTableColumns('pagamento_documentos');
    if (!hasColumn(pagDocCols, 'path_boleto_pdf')) {
      await run('ALTER TABLE pagamento_documentos ADD COLUMN path_boleto_pdf TEXT');
    }
    if (!hasColumn(pagDocCols, 'path_comprovante_pdf')) {
      await run('ALTER TABLE pagamento_documentos ADD COLUMN path_comprovante_pdf TEXT');
    }
  } catch (err) {
    console.warn('Could not ensure pagamento_documentos file columns', err.message || err);
  }

  const seedInserts = [
    { table: 'combustiveis', cols: ['tipo'], values: ['Não definido', 'Gasolina', 'Alcool', 'Flex', 'GNV', 'Gasolina/GNV', 'Flex/GNV', 'Diesel', 'Tri-Combustivel', 'Diesel/GNV'] },
    { table: 'tipo_manutencao', cols: ['descricao'], values: ['Revisão', 'Troca de óleo', 'Pneus', 'Freios'] },
  ];
  for (const { table, cols, values } of seedInserts) {
    const sql = insertIgnore(table, cols, 1);
    for (const val of values) {
      await seedIfMissing(sql, [val]);
    }
  }

  await run(insertIgnore('configuracoes', ['id', 'cod_pais', 'idioma', 'culture_info'], 4), [1, 'BR', 'pt-BR', 'pt-BR']);

  await run(`
    CREATE TABLE IF NOT EXISTS logs_auditoria (
      id ${AI},
      user_id INTEGER,
      username TEXT NOT NULL,
      acao TEXT NOT NULL,
      entidade TEXT NOT NULL,
      entidade_id TEXT,
      descricao TEXT,
      dados_antigos TEXT,
      dados_novos TEXT,
      ip TEXT,
      created_at TEXT DEFAULT (${NOW})
    )
  `);

  try {
    const adminPassHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin', 10);
    await run(insertIgnore('usuarios', ['id', 'username', 'password', 'role', 'ativo'], 5), [1, 'admin', adminPassHash, 'root', 1]);
  } catch (err) {
    console.warn('Could not seed admin user', err.message || err);
  }

  await run(insertIgnore('versoes', ['id', 'version'], 2), [1, process.env.npm_package_version || '1.1.0']);

  try {
    await run("UPDATE veiculos SET combustivel = NULL WHERE combustivel IS NOT NULL AND combustivel NOT IN (SELECT id FROM combustiveis)");
    await run("UPDATE veiculos SET cidade_id = NULL WHERE cidade_id IS NOT NULL AND cidade_id NOT IN (SELECT id FROM cidades)");
    await run("UPDATE cnhs SET veiculo_id = NULL WHERE veiculo_id IS NOT NULL AND veiculo_id NOT IN (SELECT placa FROM veiculos)");
  } catch (err) {
    console.warn('Could not clean orphaned FK references', err.message || err);
  }

  const FK_INDEXES = [
    'CREATE INDEX IF NOT EXISTS idx_manutencoes_veiculo ON manutencoes(veiculo_id)',
    'CREATE INDEX IF NOT EXISTS idx_manutencoes_mecanica ON manutencoes(mecanica_id)',
    'CREATE INDEX IF NOT EXISTS idx_manutencoes_tipo ON manutencoes(tipo_manutencao_id)',
    'CREATE INDEX IF NOT EXISTS idx_multas_veiculo ON multas(veiculo_id)',
    'CREATE INDEX IF NOT EXISTS idx_contratos_seguro_veiculo ON contratos_seguro(veiculo_id)',
    'CREATE INDEX IF NOT EXISTS idx_contratos_seguro_seguradora ON contratos_seguro(seguradora_id)',
    'CREATE INDEX IF NOT EXISTS idx_pagamentos_seguro_veiculo ON pagamentos_seguro(veiculo_id)',
    'CREATE INDEX IF NOT EXISTS idx_pagamentos_seguro_contrato ON pagamentos_seguro(contrato_seguro_id)',
    'CREATE INDEX IF NOT EXISTS idx_pagamento_documentos_veiculo ON pagamento_documentos(veiculo_id)',
    'CREATE INDEX IF NOT EXISTS idx_higienizacao_veiculo ON higienizacao(veiculo_id)',
    'CREATE INDEX IF NOT EXISTS idx_abastecimentos_veiculo ON abastecimentos(veiculo_id)',
    'CREATE INDEX IF NOT EXISTS idx_cnhs_veiculo ON cnhs(veiculo_id)',
  ];
  for (const sql of FK_INDEXES) {
    try { await run(sql); } catch (_) {}
  }
}

module.exports = { initDb };
