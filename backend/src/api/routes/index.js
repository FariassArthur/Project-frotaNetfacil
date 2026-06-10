const { registerRoutes: registerAuthRoutes } = require('./auth.routes');
const { registerRoutes: registerVeiculosRoutes } = require('./veiculos.routes');
const { registerRoutes: registerUsuariosRoutes } = require('./usuarios.routes');
const { registerRoutes: registerDashboardRoutes } = require('./dashboard.routes');
const { registerRoutes: registerLookupRoutes } = require('./lookup.routes');
const { registerRoutes: registerLogsRoutes } = require('./logs.routes');
const { registerRoutes: registerGastosRoutes } = require('./gastos.routes');
const { registerRoutes: registerCidadesRoutes } = require('./cidades.routes');
const { createRoutesFor } = require('./entityRoutes.routes');
const { registerRoutes: registerManutencaoPreventivaRoutes } = require('./manutencaoPreventiva.routes');
const { registerRoutes: registerViagensRoutes } = require('./viagens.routes');
const { registerRoutes: registerCalendarioRoutes } = require('./calendario.routes');
const { registerRoutes: registerOrdensServicoRoutes } = require('./ordensServico.routes');
const { registerRoutes: registerMotoristaMultasRoutes } = require('./motoristaMultas.routes');
const { registerRoutes: registerMotoristaHistoricoRoutes } = require('./motoristaHistorico.routes');
const { registerRoutes: registerComparativoVeiculosRoutes } = require('./comparativoVeiculos.routes');
const { registerRoutes: registerImportarCSVRoutes } = require('./importarCSV.routes');

function registerRoutes(app) {
  registerAuthRoutes(app);
  registerComparativoVeiculosRoutes(app);
  registerVeiculosRoutes(app);
  registerUsuariosRoutes(app);
  registerDashboardRoutes(app);
  registerLookupRoutes(app);
  registerLogsRoutes(app);
  registerGastosRoutes(app);
  registerManutencaoPreventivaRoutes(app);
  registerViagensRoutes(app);
  registerCalendarioRoutes(app);
  registerOrdensServicoRoutes(app);
  registerMotoristaMultasRoutes(app);
  registerMotoristaHistoricoRoutes(app);
  registerImportarCSVRoutes(app);

  createRoutesFor(app, {
    name: 'cnhs',
    tableName: 'cnhs',
    keyField: 'numero_registro',
    fields: ['numero_registro', 'nome', 'nascimento', 'categoria', 'cpf', 'filiacao', 'primeira_habilitacao', 'emissao', 'validade', 'local', 'path_foto', 'path_documento_pdf', 'aivo', 'veiculo_id'],
    fileFields: ['path_foto', 'path_documento_pdf']
  });

  createRoutesFor(app, {
    name: 'mecanicas',
    tableName: 'mecanicas',
    keyField: 'id',
    fields: ['nome', 'endereco', 'numero', 'complemento', 'cep', 'bairro', 'cidade', 'uf', 'site', 'email', 'telefone1', 'telefone2', 'celular1', 'celular1_operadora', 'celular2', 'celular2_operadora', 'contatos', 'observacao']
  });

  createRoutesFor(app, {
    name: 'tipo-manutencao',
    tableName: 'tipo_manutencao',
    keyField: 'id',
    fields: ['descricao']
  });

  createRoutesFor(app, {
    name: 'manutencoes',
    tableName: 'manutencoes',
    keyField: 'id',
    fields: ['data', 'data_s', 'classificacao', 'valor', 'descricao', 'km', 'path_comprovante_pdf', 'veiculo_id', 'mecanica_id', 'tipo_manutencao_id'],
    fileFields: ['path_comprovante_pdf']
  });

  createRoutesFor(app, {
    name: 'multas',
    tableName: 'multas',
    keyField: 'id',
    fields: ['data_ocorrencia', 'data_ocorrencia_s', 'local_ocorrencia', 'data_vencimento', 'data_vencimento_s', 'data_pagamento', 'data_pagamento_s', 'valor', 'path_anexo_multa_pdf', 'pagamento_realizado', 'veiculo_id', 'motorista_id'],
    fileFields: ['path_anexo_multa_pdf']
  });

  createRoutesFor(app, {
    name: 'seguradoras',
    tableName: 'seguradoras',
    keyField: 'id',
    fields: ['nome', 'corretor', 'endereco', 'numero', 'complemento', 'cep', 'bairro', 'cidade', 'uf', 'site', 'email', 'telefone1', 'telefone2', 'celular1', 'celular1_operadora', 'celular2', 'celular2_operadora', 'contatos']
  });

  createRoutesFor(app, {
    name: 'contratos-seguro',
    tableName: 'contratos_seguro',
    keyField: 'id',
    fields: ['numero_apolice', 'data_inicial_contrato', 'data_final_contrato', 'ativo', 'path_orcamento_pdf', 'path_contrato_pdf', 'path_cartao_pdf', 'seguradora_id', 'veiculo_id'],
    fileFields: ['path_orcamento_pdf', 'path_contrato_pdf', 'path_cartao_pdf']
  });

  createRoutesFor(app, {
    name: 'pagamentos-seguro',
    tableName: 'pagamentos_seguro',
    keyField: 'id',
    fields: ['data_pagamento', 'valor', 'path_pagamento_pdf', 'contrato_seguro_id', 'veiculo_id'],
    fileFields: ['path_pagamento_pdf']
  });

  createRoutesFor(app, {
    name: 'pagamento-documentos',
    tableName: 'pagamento_documentos',
    keyField: 'id',
    fields: ['data_pagamento', 'data_pagamento_s', 'data_vencimento', 'data_vencimento_s', 'valor', 'descricao', 'path_boleto_pdf', 'path_comprovante_pdf', 'veiculo_id'],
    fileFields: ['path_boleto_pdf', 'path_comprovante_pdf']
  });

  createRoutesFor(app, {
    name: 'higienizacao',
    tableName: 'higienizacao',
    keyField: 'id',
    fields: ['data', 'local', 'valor', 'path_comprovante_pdf', 'veiculo_id'],
    fileFields: ['path_comprovante_pdf']
  });

  registerCidadesRoutes(app);

  createRoutesFor(app, {
    name: 'cidades',
    tableName: 'cidades',
    keyField: 'id',
    fields: ['nome', 'uf']
  });

  createRoutesFor(app, {
    name: 'abastecimentos',
    tableName: 'abastecimentos',
    keyField: 'id',
    fields: ['quantidade', 'combustivel_id', 'valor', 'km', 'tanque_cheio', 'path_comprovante_pdf', 'data', 'data_s', 'veiculo_id'],
    fileFields: ['path_comprovante_pdf']
  });

  createRoutesFor(app, {
    name: 'vistorias',
    tableName: 'vistorias',
    keyField: 'id',
    fields: ['veiculo_id', 'tipo', 'data', 'km', 'itens', 'status', 'observacoes', 'motorista_nome', 'path_foto'],
    fileFields: ['path_foto']
  });

  createRoutesFor(app, {
    name: 'pneus',
    tableName: 'pneus',
    keyField: 'id',
    fields: ['veiculo_id', 'identificacao', 'marca', 'modelo', 'medidas', 'dot', 'posicao', 'km_instalacao', 'data_instalacao', 'km_retirada', 'data_retirada', 'status', 'nf', 'valor', 'observacoes', 'path_foto'],
    fileFields: ['path_foto']
  });

  createRoutesFor(app, {
    name: 'ordens-servico',
    tableName: 'ordens_servico',
    keyField: 'id',
    fields: ['veiculo_id', 'numero_os', 'data_abertura', 'data_conclusao', 'km_atual', 'descricao', 'tipo', 'status', 'prioridade', 'mecanica_id', 'valor_mao_obra', 'valor_pecas', 'observacoes', 'criado_por'],
  });
}

module.exports = { registerRoutes };
