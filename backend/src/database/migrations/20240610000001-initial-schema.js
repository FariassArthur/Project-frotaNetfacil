module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('combustiveis', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      tipo: { type: Sequelize.STRING, allowNull: false, unique: true },
    });

    await queryInterface.createTable('cidades', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome: { type: Sequelize.STRING, allowNull: false, unique: true },
      uf: { type: Sequelize.STRING },
    });

    await queryInterface.createTable('veiculos', {
      placa: { type: Sequelize.STRING, primaryKey: true },
      numero: Sequelize.STRING,
      tipo: Sequelize.STRING,
      fipe_name_marca: Sequelize.STRING,
      fipe_modelo: Sequelize.STRING,
      fipe_name_ano: Sequelize.STRING,
      renavam: Sequelize.STRING,
      chassi: Sequelize.STRING,
      combustivel: { type: Sequelize.INTEGER, references: { model: 'combustiveis', key: 'id' }, onDelete: 'SET NULL' },
      ano_fab: Sequelize.STRING,
      ano_modelo: Sequelize.STRING,
      capacidade: Sequelize.STRING,
      cor: Sequelize.STRING,
      cidade: Sequelize.STRING,
      cidade_id: { type: Sequelize.INTEGER, references: { model: 'cidades', key: 'id' }, onDelete: 'SET NULL' },
      uf: Sequelize.STRING,
      cpfcnpj: Sequelize.STRING,
      categoria: Sequelize.STRING,
      km: Sequelize.INTEGER,
      nome_endereco: Sequelize.STRING,
      data_aquisicao: Sequelize.STRING,
      observacao: Sequelize.TEXT,
      potencia: Sequelize.STRING,
      culture_info: Sequelize.STRING,
      medidas_pneus: Sequelize.STRING,
      codigo_postal: Sequelize.STRING,
      path_documento_pdf: Sequelize.STRING,
      data_vencimento_ipva: Sequelize.STRING,
      ativo: Sequelize.INTEGER,
    });

    await queryInterface.createTable('cnhs', {
      numero_registro: { type: Sequelize.STRING, primaryKey: true },
      nome: Sequelize.STRING,
      nascimento: Sequelize.STRING,
      categoria: Sequelize.STRING,
      cpf: Sequelize.STRING,
      filiacao: Sequelize.STRING,
      primeira_habilitacao: Sequelize.STRING,
      emissao: Sequelize.STRING,
      validade: Sequelize.STRING,
      local: Sequelize.STRING,
      path_documento_pdf: Sequelize.STRING,
      aivo: Sequelize.INTEGER,
      veiculo_id: { type: Sequelize.STRING, references: { model: 'veiculos', key: 'placa' }, onDelete: 'SET NULL' },
      path_foto: Sequelize.STRING,
    });

    await queryInterface.createTable('mecanicas', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome: Sequelize.STRING,
      endereco: Sequelize.STRING,
      numero: Sequelize.STRING,
      complemento: Sequelize.STRING,
      cep: Sequelize.STRING,
      bairro: Sequelize.STRING,
      cidade: Sequelize.STRING,
      uf: Sequelize.STRING,
      site: Sequelize.STRING,
      email: Sequelize.STRING,
      telefone1: Sequelize.STRING,
      telefone2: Sequelize.STRING,
      celular1: Sequelize.STRING,
      celular1_operadora: Sequelize.STRING,
      celular2: Sequelize.STRING,
      celular2_operadora: Sequelize.STRING,
      contatos: Sequelize.TEXT,
      observacao: Sequelize.TEXT,
    });

    await queryInterface.createTable('tipo_manutencao', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      descricao: Sequelize.STRING,
    });

    await queryInterface.createTable('manutencoes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      data: Sequelize.STRING,
      data_s: Sequelize.STRING,
      valor: Sequelize.FLOAT,
      descricao: Sequelize.TEXT,
      km: Sequelize.INTEGER,
      classificacao: { type: Sequelize.STRING, defaultValue: 'preventiva' },
      path_comprovante_pdf: Sequelize.STRING,
      veiculo_id: { type: Sequelize.STRING, references: { model: 'veiculos', key: 'placa' }, onDelete: 'CASCADE' },
      mecanica_id: { type: Sequelize.INTEGER, references: { model: 'mecanicas', key: 'id' }, onDelete: 'SET NULL' },
      tipo_manutencao_id: { type: Sequelize.INTEGER, references: { model: 'tipo_manutencao', key: 'id' }, onDelete: 'SET NULL' },
    });

    await queryInterface.createTable('multas', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      data_ocorrencia: Sequelize.STRING,
      data_ocorrencia_s: Sequelize.STRING,
      local_ocorrencia: Sequelize.STRING,
      data_vencimento: Sequelize.STRING,
      data_vencimento_s: Sequelize.STRING,
      data_pagamento: Sequelize.STRING,
      data_pagamento_s: Sequelize.STRING,
      valor: Sequelize.FLOAT,
      path_anexo_multa_pdf: Sequelize.STRING,
      pagamento_realizado: Sequelize.INTEGER,
      veiculo_id: { type: Sequelize.STRING, references: { model: 'veiculos', key: 'placa' }, onDelete: 'CASCADE' },
      motorista_id: { type: Sequelize.STRING, references: { model: 'cnhs', key: 'numero_registro' }, onDelete: 'SET NULL' },
    });

    await queryInterface.createTable('seguradoras', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome: Sequelize.STRING,
      corretor: Sequelize.STRING,
      endereco: Sequelize.STRING,
      numero: Sequelize.STRING,
      complemento: Sequelize.STRING,
      cep: Sequelize.STRING,
      bairro: Sequelize.STRING,
      cidade: Sequelize.STRING,
      uf: Sequelize.STRING,
      site: Sequelize.STRING,
      email: Sequelize.STRING,
      telefone1: Sequelize.STRING,
      telefone2: Sequelize.STRING,
      celular1: Sequelize.STRING,
      celular1_operadora: Sequelize.STRING,
      celular2: Sequelize.STRING,
      celular2_operadora: Sequelize.STRING,
      contatos: Sequelize.TEXT,
    });

    await queryInterface.createTable('contratos_seguro', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      numero_apolice: Sequelize.STRING,
      data_inicial_contrato: Sequelize.STRING,
      data_final_contrato: Sequelize.STRING,
      ativo: Sequelize.INTEGER,
      path_orcamento_pdf: Sequelize.STRING,
      path_contrato_pdf: Sequelize.STRING,
      path_cartao_pdf: Sequelize.STRING,
      seguradora_id: { type: Sequelize.INTEGER, references: { model: 'seguradoras', key: 'id' }, onDelete: 'SET NULL' },
      veiculo_id: { type: Sequelize.STRING, references: { model: 'veiculos', key: 'placa' }, onDelete: 'CASCADE' },
    });

    await queryInterface.createTable('pagamentos_seguro', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      data_pagamento: Sequelize.STRING,
      valor: Sequelize.FLOAT,
      path_pagamento_pdf: Sequelize.STRING,
      contrato_seguro_id: { type: Sequelize.INTEGER, references: { model: 'contratos_seguro', key: 'id' }, onDelete: 'CASCADE' },
      veiculo_id: { type: Sequelize.STRING, references: { model: 'veiculos', key: 'placa' }, onDelete: 'CASCADE' },
    });

    await queryInterface.createTable('pagamento_documentos', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      data_pagamento: Sequelize.STRING,
      data_pagamento_s: Sequelize.STRING,
      data_vencimento: Sequelize.STRING,
      data_vencimento_s: Sequelize.STRING,
      valor: Sequelize.FLOAT,
      descricao: Sequelize.STRING,
      path_boleto_pdf: Sequelize.STRING,
      path_comprovante_pdf: Sequelize.STRING,
      veiculo_id: { type: Sequelize.STRING, references: { model: 'veiculos', key: 'placa' }, onDelete: 'CASCADE' },
    });

    await queryInterface.createTable('higienizacao', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      data: Sequelize.STRING,
      local: Sequelize.STRING,
      valor: Sequelize.FLOAT,
      path_comprovante_pdf: Sequelize.STRING,
      veiculo_id: { type: Sequelize.STRING, references: { model: 'veiculos', key: 'placa' }, onDelete: 'CASCADE' },
    });

    await queryInterface.createTable('abastecimentos', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      quantidade: Sequelize.FLOAT,
      combustivel_id: { type: Sequelize.INTEGER, references: { model: 'combustiveis', key: 'id' }, onDelete: 'SET NULL' },
      valor: Sequelize.FLOAT,
      km: Sequelize.INTEGER,
      tanque_cheio: { type: Sequelize.INTEGER, defaultValue: 0 },
      path_comprovante_pdf: Sequelize.STRING,
      data: Sequelize.STRING,
      data_s: Sequelize.STRING,
      veiculo_id: { type: Sequelize.STRING, references: { model: 'veiculos', key: 'placa' }, onDelete: 'CASCADE' },
    });

    await queryInterface.createTable('viagens', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      veiculo_id: { type: Sequelize.STRING, references: { model: 'veiculos', key: 'placa' }, onDelete: 'CASCADE' },
      motorista_id: { type: Sequelize.STRING, references: { model: 'cnhs', key: 'numero_registro' }, onDelete: 'SET NULL' },
      data_saida: Sequelize.STRING,
      data_saida_s: Sequelize.STRING,
      data_retorno: Sequelize.STRING,
      data_retorno_s: Sequelize.STRING,
      km_inicial: Sequelize.INTEGER,
      km_final: Sequelize.INTEGER,
      destino: Sequelize.STRING,
      descricao: Sequelize.TEXT,
    });

    await queryInterface.createTable('config_manutencao_preventiva', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      veiculo_id: { type: Sequelize.STRING, references: { model: 'veiculos', key: 'placa' }, onDelete: 'CASCADE' },
      tipo_manutencao_id: { type: Sequelize.INTEGER, references: { model: 'tipo_manutencao', key: 'id' }, onDelete: 'SET NULL' },
      descricao: Sequelize.STRING,
      km_intervalo: Sequelize.INTEGER,
      km_proxima: Sequelize.INTEGER,
      meses_intervalo: Sequelize.INTEGER,
      data_proxima: Sequelize.STRING,
      ativo: { type: Sequelize.INTEGER, defaultValue: 1 },
    });

    await queryInterface.createTable('vistorias', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      veiculo_id: { type: Sequelize.STRING, references: { model: 'veiculos', key: 'placa' }, onDelete: 'CASCADE' },
      tipo: { type: Sequelize.STRING, defaultValue: 'saida' },
      data: Sequelize.STRING,
      km: Sequelize.INTEGER,
      itens: Sequelize.TEXT,
      status: { type: Sequelize.STRING, defaultValue: 'ok' },
      observacoes: Sequelize.TEXT,
      motorista_nome: Sequelize.STRING,
      path_foto: Sequelize.STRING,
    });

    await queryInterface.createTable('pneus', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      veiculo_id: { type: Sequelize.STRING, references: { model: 'veiculos', key: 'placa' }, onDelete: 'SET NULL' },
      identificacao: Sequelize.STRING,
      marca: Sequelize.STRING,
      modelo: Sequelize.STRING,
      medidas: Sequelize.STRING,
      dot: Sequelize.STRING,
      posicao: Sequelize.STRING,
      km_instalacao: Sequelize.INTEGER,
      data_instalacao: Sequelize.STRING,
      km_retirada: Sequelize.INTEGER,
      data_retirada: Sequelize.STRING,
      status: { type: Sequelize.STRING, defaultValue: 'ativo' },
      nf: Sequelize.STRING,
      valor: Sequelize.FLOAT,
      observacoes: Sequelize.TEXT,
      path_foto: Sequelize.STRING,
    });

    await queryInterface.createTable('ordens_servico', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      veiculo_id: { type: Sequelize.STRING, allowNull: false, references: { model: 'veiculos', key: 'placa' }, onDelete: 'CASCADE' },
      numero_os: Sequelize.STRING,
      data_abertura: { type: Sequelize.STRING, allowNull: false },
      data_conclusao: Sequelize.STRING,
      km_atual: Sequelize.INTEGER,
      descricao: Sequelize.TEXT,
      tipo: { type: Sequelize.STRING, defaultValue: 'corretiva' },
      status: { type: Sequelize.STRING, defaultValue: 'aberta' },
      prioridade: { type: Sequelize.STRING, defaultValue: 'normal' },
      mecanica_id: { type: Sequelize.INTEGER, references: { model: 'mecanicas', key: 'id' }, onDelete: 'SET NULL' },
      valor_mao_obra: Sequelize.FLOAT,
      valor_pecas: Sequelize.FLOAT,
      observacoes: Sequelize.TEXT,
      criado_por: { type: Sequelize.STRING, references: { model: 'usuarios', key: 'username' }, onDelete: 'SET NULL' },
      created_at: { type: Sequelize.STRING },
      updated_at: { type: Sequelize.STRING },
    });

    await queryInterface.createTable('versoes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      version: Sequelize.STRING,
    });

    await queryInterface.createTable('configuracoes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      cod_pais: { type: Sequelize.STRING, allowNull: false },
      idioma: { type: Sequelize.STRING, allowNull: false },
      culture_info: { type: Sequelize.STRING, allowNull: false },
    });

    await queryInterface.createTable('usuarios', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      username: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      role: { type: Sequelize.STRING, defaultValue: 'user' },
      ativo: { type: Sequelize.INTEGER, defaultValue: 1 },
      permissoes: { type: Sequelize.STRING, defaultValue: 'all' },
      nome_completo: { type: Sequelize.STRING, defaultValue: '' },
      email: { type: Sequelize.STRING, defaultValue: '' },
      telefone: { type: Sequelize.STRING, defaultValue: '' },
    });

    await queryInterface.createTable('logs_auditoria', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: Sequelize.INTEGER,
      username: { type: Sequelize.STRING, allowNull: false },
      acao: { type: Sequelize.STRING, allowNull: false },
      entidade: { type: Sequelize.STRING, allowNull: false },
      entidade_id: Sequelize.STRING,
      descricao: Sequelize.TEXT,
      dados_antigos: Sequelize.TEXT,
      dados_novos: Sequelize.TEXT,
      ip: Sequelize.STRING,
      created_at: Sequelize.STRING,
    });

    await queryInterface.createTable('token_blacklist', {
      token_hash: { type: Sequelize.STRING, primaryKey: true },
      expires_at: { type: Sequelize.BIGINT, allowNull: false },
    });
  },

  down: async (queryInterface) => {
    const tables = [
      'token_blacklist', 'logs_auditoria', 'usuarios', 'configuracoes', 'versoes',
      'ordens_servico', 'pneus', 'vistorias', 'config_manutencao_preventiva', 'viagens',
      'abastecimentos', 'higienizacao', 'pagamento_documentos', 'pagamentos_seguro',
      'contratos_seguro', 'seguradoras', 'multas', 'manutencoes', 'tipo_manutencao',
      'mecanicas', 'cnhs', 'veiculos', 'cidades', 'combustiveis',
    ];
    for (const t of tables) {
      await queryInterface.dropTable(t);
    }
  },
};
