// Shared module configuration and helpers
export const MODULES = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Painel de controle inicial com status da API e navegação entre módulos.',
    endpoint: null,
    keyField: null,
    fields: []
  },
  {
    key: 'veiculos',
    label: 'Veículos',
    endpoint: '/api/veiculos',
    keyField: 'placa',
    fields: [
      { name: 'placa', label: 'Placa', type: 'text', required: true },
      { name: 'tipo', label: 'Tipo' },
      { name: 'pathDocumentoPDF', label: 'Documento', type: 'file' },
      { name: 'fipeNameMarca', label: 'Marca FIPE' },
      { name: 'fipeModelo', label: 'Modelo FIPE' },
      { name: 'fipeNameAno', label: 'Ano FIPE' },
      { name: 'renavam', label: 'Renavam' },
      { name: 'chassi', label: 'Chassi' },
      { name: 'combustivel', label: 'Combustível', type: 'number' },
      { name: 'anoFab', label: 'Ano Fabricação' },
      { name: 'anoModelo', label: 'Ano Modelo' },
      { name: 'capacidade', label: 'Capacidade' },
      { name: 'cor', label: 'Cor' },
      { name: 'cidade', label: 'Cidade' },
      { name: 'uf', label: 'UF' },
      { name: 'cpfcnpj', label: 'CPF/CNPJ' },
      { name: 'categoria', label: 'Categoria' },
      { name: 'km', label: 'KM', type: 'number' },
      { name: 'nomeEndereco', label: 'Endereço' },
      { name: 'dataAquisicao', label: 'Data Aquisição', type: 'date' },
      { name: 'observacao', label: 'Observação', type: 'textarea' },
      { name: 'potencia', label: 'Potência' },
      { name: 'cultureInfo', label: 'Culture Info' },
      { name: 'medidasPneus', label: 'Medidas Pneus' },
      { name: 'codigoPostal', label: 'CEP' },
      { name: 'dataVencimentoIPVA', label: 'Vencimento IPVA', type: 'date' },
      { name: 'ativo', label: 'Ativo', type: 'checkbox' }
    ]
  },
  {
    key: 'cnhs',
    label: 'CNHs',
    endpoint: '/api/cnhs',
    keyField: 'numero_registro',
    fields: [
      { name: 'numero_registro', label: 'Número Registro', required: true },
      { name: 'nome', label: 'Nome' },
      { name: 'nascimento', label: 'Nascimento', type: 'date' },
      { name: 'categoria', label: 'Categoria' },
      { name: 'cpf', label: 'CPF' },
      { name: 'filiacao', label: 'Filiação' },
      { name: 'primeira_habilitacao', label: 'Primeira Habilitação', type: 'date' },
      { name: 'emissao', label: 'Emissão', type: 'date' },
      { name: 'validade', label: 'Validade', type: 'date' },
      { name: 'local', label: 'Local' },
      { name: 'path_documento_pdf', label: 'Arquivo CNH', type: 'file' },
      { name: 'aivo', label: 'Ativo', type: 'checkbox' },
      { name: 'veiculo_id', label: 'Placa Veículo' }
    ]
  },
  {
    key: 'mecanicas',
    label: 'Mecânicas',
    endpoint: '/api/mecanicas',
    keyField: 'id',
    fields: [
      { name: 'nome', label: 'Nome' },
      { name: 'endereco', label: 'Endereço' },
      { name: 'numero', label: 'Número' },
      { name: 'complemento', label: 'Complemento' },
      { name: 'cep', label: 'CEP' },
      { name: 'bairro', label: 'Bairro' },
      { name: 'cidade', label: 'Cidade' },
      { name: 'uf', label: 'UF' },
      { name: 'site', label: 'Site' },
      { name: 'email', label: 'Email' },
      { name: 'telefone1', label: 'Telefone 1' },
      { name: 'telefone2', label: 'Telefone 2' },
      { name: 'celular1', label: 'Celular 1' },
      { name: 'celular1_operadora', label: 'Operadora 1' },
      { name: 'celular2', label: 'Celular 2' },
      { name: 'celular2_operadora', label: 'Operadora 2' },
      { name: 'contatos', label: 'Contatos' },
      { name: 'observacao', label: 'Observação', type: 'textarea' }
    ]
  },
  {
    key: 'manutencoes',
    label: 'Manutenções',
    endpoint: '/api/manutencoes',
    keyField: 'id',
    fields: [
      { name: 'data', label: 'Data', type: 'date' },
      { name: 'data_s', label: 'Data Texto' },
      { name: 'classificacao', label: 'Classificação', type: 'select', options: ['preventiva', 'corretiva'] },
      { name: 'valor', label: 'Valor', type: 'number' },
      { name: 'descricao', label: 'Descrição', type: 'textarea' },
      { name: 'km', label: 'KM', type: 'number' },
      { name: 'path_comprovante_pdf', label: 'Comprovante PDF', type: 'file' },
      { name: 'veiculo_id', label: 'Placa do Veículo' },
      { name: 'mecanica_id', label: 'ID Mecânica', type: 'number' },
      { name: 'tipo_manutencao_id', label: 'Tipo Manutenção ID', type: 'number' }
    ]
  },
  {
    key: 'multas',
    label: 'Multas',
    endpoint: '/api/multas',
    keyField: 'id',
    fields: [
      { name: 'data_ocorrencia', label: 'Data Ocorrência', type: 'date' },
      { name: 'data_ocorrencia_s', label: 'Data Ocorrência Texto' },
      { name: 'local_ocorrencia', label: 'Local' },
      { name: 'data_vencimento', label: 'Data Vencimento', type: 'date' },
      { name: 'data_vencimento_s', label: 'Data Vencimento Texto' },
      { name: 'data_pagamento', label: 'Data Pagamento', type: 'date' },
      { name: 'data_pagamento_s', label: 'Data Pagamento Texto' },
      { name: 'valor', label: 'Valor', type: 'number' },
      { name: 'path_anexo_multa_pdf', label: 'Anexo Multa', type: 'file' },
      { name: 'pagamento_realizado', label: 'Pagamento Realizado', type: 'checkbox' },
      { name: 'veiculo_id', label: 'Placa do Veículo' }
    ]
  },
  {
    key: 'seguradoras',
    label: 'Seguradoras',
    endpoint: '/api/seguradoras',
    keyField: 'id',
    fields: [
      { name: 'nome', label: 'Nome' },
      { name: 'corretor', label: 'Corretor' },
      { name: 'endereco', label: 'Endereço' },
      { name: 'numero', label: 'Número' },
      { name: 'complemento', label: 'Complemento' },
      { name: 'cep', label: 'CEP' },
      { name: 'bairro', label: 'Bairro' },
      { name: 'cidade', label: 'Cidade' },
      { name: 'uf', label: 'UF' },
      { name: 'site', label: 'Site' },
      { name: 'email', label: 'Email' },
      { name: 'telefone1', label: 'Telefone 1' },
      { name: 'telefone2', label: 'Telefone 2' },
      { name: 'celular1', label: 'Celular 1' },
      { name: 'celular1_operadora', label: 'Operadora 1' },
      { name: 'celular2', label: 'Celular 2' },
      { name: 'celular2_operadora', label: 'Operadora 2' },
      { name: 'contatos', label: 'Contatos' }
    ]
  },
  {
    key: 'contratos-seguro',
    label: 'Contratos Seguro',
    endpoint: '/api/contratos-seguro',
    keyField: 'id',
    fields: [
      { name: 'numero_apolice', label: 'Número Apólice' },
      { name: 'data_inicial_contrato', label: 'Início', type: 'date' },
      { name: 'data_final_contrato', label: 'Fim', type: 'date' },
      { name: 'ativo', label: 'Ativo', type: 'checkbox' },
      { name: 'path_orcamento_pdf', label: 'Orçamento PDF', type: 'file' },
      { name: 'path_contrato_pdf', label: 'Contrato PDF', type: 'file' },
      { name: 'path_cartao_pdf', label: 'Cartão PDF', type: 'file' },
      { name: 'seguradora_id', label: 'Seguradora ID', type: 'number' },
      { name: 'veiculo_id', label: 'Placa do Veículo' }
    ]
  },
  {
    key: 'pagamentos-seguro',
    label: 'Pagamentos Seguro',
    endpoint: '/api/pagamentos-seguro',
    keyField: 'id',
    fields: [
      { name: 'data_pagamento', label: 'Data Pagamento', type: 'date' },
      { name: 'valor', label: 'Valor', type: 'number' },
      { name: 'path_pagamento_pdf', label: 'Comprovante PDF', type: 'file' },
      { name: 'contrato_seguro_id', label: 'Contrato Seguro ID', type: 'number' },
      { name: 'veiculo_id', label: 'Placa do Veículo' }
    ]
  },
  {
    key: 'pagamento-documentos',
    label: 'Pagamentos Documento',
    endpoint: '/api/pagamento-documentos',
    keyField: 'id',
    fields: [
      { name: 'data_pagamento', label: 'Data Pagamento', type: 'date' },
      { name: 'data_pagamento_s', label: 'Data Pagamento Texto' },
      { name: 'data_vencimento', label: 'Data Vencimento', type: 'date' },
      { name: 'data_vencimento_s', label: 'Data Vencimento Texto' },
      { name: 'valor', label: 'Valor', type: 'number' },
      { name: 'descricao', label: 'Descrição', type: 'textarea' },
      { name: 'veiculo_id', label: 'Placa do Veículo' }
    ]
  },
  {
    key: 'configuracoes',
    label: 'Configurações',
    endpoint: '/api/configuracoes',
    keyField: null,
    fields: [
      { name: 'codPais', label: 'País' },
      { name: 'idioma', label: 'Idioma' },
      { name: 'cultureInfo', label: 'Culture Info' }
    ]
  },
  {
    key: 'versao',
    label: 'Versão',
    endpoint: '/api/versao',
    keyField: null,
    fields: []
  }
];

export const getByKey = (key) => MODULES.find((item) => item.key === key) || MODULES[0];

export const createItem = (fields) => {
  return fields.reduce((acc, field) => {
    acc[field.name] = field.type === 'checkbox' ? false : '';
    return acc;
  }, {});
};
