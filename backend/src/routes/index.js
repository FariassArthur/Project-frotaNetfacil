const { registerAuthRoutes } = require('./auth');
const { registerVeiculosRoutes } = require('./veiculos');
const { registerUsuariosRoutes } = require('./usuarios');
const { registerDashboardRoutes } = require('./dashboard');
const { registerLookupRoutes } = require('./lookup');
const { createRoutesFor } = require('./entityRoutes');

function registerRoutes(app) {
  registerAuthRoutes(app);
  registerVeiculosRoutes(app);
  registerUsuariosRoutes(app);
  registerDashboardRoutes(app);
  registerLookupRoutes(app);

  // Generic CRUD entities
  createRoutesFor(app, {
    name: 'cnhs',
    tableName: 'cnhs',
    keyField: 'numero_registro',
    fields: ['numero_registro', 'nome', 'nascimento', 'categoria', 'cpf', 'filiacao', 'primeira_habilitacao', 'emissao', 'validade', 'local', 'path_documento_pdf', 'aivo', 'veiculo_id'],
    fileFields: ['path_documento_pdf']
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
    fields: ['data_ocorrencia', 'data_ocorrencia_s', 'local_ocorrencia', 'data_vencimento', 'data_vencimento_s', 'data_pagamento', 'data_pagamento_s', 'valor', 'path_anexo_multa_pdf', 'pagamento_realizado', 'veiculo_id'],
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
    fields: ['data_pagamento', 'data_pagamento_s', 'data_vencimento', 'data_vencimento_s', 'valor', 'descricao', 'veiculo_id']
  });

  createRoutesFor(app, {
    name: 'abastecimentos',
    tableName: 'abastecimentos',
    keyField: 'id',
    fields: ['quantidade', 'combustivel_id', 'valor', 'km', 'path_comprovante_pdf', 'data', 'data_s', 'veiculo_id'],
    fileFields: ['path_comprovante_pdf']
  });
}

module.exports = { registerRoutes };
