import { FaChartBar, FaTruck, FaTools, FaBuilding, FaCity, FaGlobeAmericas, FaCog, FaInfoCircle, FaClipboardList } from 'react-icons/fa';

// Shared module configuration and helpers
export const MODULES = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: FaChartBar,
    description: 'Painel de controle inicial com status da API e navegação entre módulos.',
    endpoint: null,
    keyField: null,
    fields: []
  },
  {
    key: 'veiculos',
    label: 'Veículos',
    icon: FaTruck,
    endpoint: '/api/veiculos',
    keyField: 'placa',
    fields: [
      { name: 'placa', label: 'Placa', type: 'text', required: true },
      { name: 'numero', label: 'Número' },
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
      { name: 'cidade_id', label: 'Cidade' },
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
    label: 'Motoristas',
    sidebarHidden: true,
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
      { name: 'path_foto', label: 'Foto', type: 'file' },
      { name: 'path_documento_pdf', label: 'Arquivo CNH', type: 'file' },
      { name: 'aivo', label: 'Ativo', type: 'checkbox' },
      { name: 'veiculo_id', label: 'Placa Veículo' }
    ]
  },
  {
    key: 'mecanicas',
    label: 'Mecânicas',
    icon: FaTools,
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
    sidebarHidden: true,
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
    sidebarHidden: true,
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
      { name: 'veiculo_id', label: 'Placa do Veículo' },
      { name: 'motorista_id', label: 'Registro Motorista' }
    ]
  },
  {
    key: 'seguradoras',
    label: 'Seguradoras',
    icon: FaBuilding,
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
    key: 'cidades',
    label: 'Cidades',
    icon: FaCity,
    endpoint: '/api/cidades',
    keyField: 'id',
    fields: [
      { name: 'nome', label: 'Nome', required: true },
      { name: 'uf', label: 'UF' },
      { name: 'veiculos', label: 'Veículos', tableOnly: true },
      { name: 'motoristas', label: 'Motoristas', tableOnly: true }
    ]
  },
  {
    key: 'contratos-seguro',
    label: 'Contratos Seguro',
    sidebarHidden: true,
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
    sidebarHidden: true,
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
    sidebarHidden: true,
    endpoint: '/api/pagamento-documentos',
    keyField: 'id',
    fields: [
      { name: 'data_pagamento', label: 'Data Pagamento', type: 'date' },
      { name: 'data_pagamento_s', label: 'Data Pagamento Texto' },
      { name: 'data_vencimento', label: 'Data Vencimento', type: 'date' },
      { name: 'data_vencimento_s', label: 'Data Vencimento Texto' },
      { name: 'valor', label: 'Valor', type: 'number' },
      { name: 'descricao', label: 'Descrição', type: 'textarea' },
      { name: 'path_boleto_pdf', label: 'Boleto PDF', type: 'file' },
      { name: 'path_comprovante_pdf', label: 'Comprovante PDF', type: 'file' },
      { name: 'veiculo_id', label: 'Placa do Veículo' }
    ]
  },
  {
    key: 'abastecimentos',
    label: 'Abastecimentos',
    sidebarHidden: true,
    endpoint: '/api/abastecimentos',
    keyField: 'id',
    fields: [
      { name: 'data', label: 'Data', type: 'date' },
      { name: 'data_s', label: 'Data Texto' },
      { name: 'quantidade', label: 'Quantidade (L)', type: 'number' },
      { name: 'valor', label: 'Valor', type: 'number' },
      { name: 'km', label: 'KM', type: 'number' },
      { name: 'path_comprovante_pdf', label: 'Comprovante PDF', type: 'file' },
      { name: 'combustivel_id', label: 'ID Combustível', type: 'number' },
      { name: 'veiculo_id', label: 'Placa do Veículo' }
    ]
  },
  {
    key: 'viagens',
    label: 'Viagens',
    icon: FaGlobeAmericas,
    endpoint: '/api/viagens',
    keyField: 'id',
    fields: [
      { name: 'data_saida', label: 'Data Saída', type: 'date' },
      { name: 'data_retorno', label: 'Data Retorno', type: 'date' },
      { name: 'km_inicial', label: 'KM Inicial', type: 'number' },
      { name: 'km_final', label: 'KM Final', type: 'number' },
      { name: 'destino', label: 'Destino' },
      { name: 'descricao', label: 'Descrição', type: 'textarea' },
      { name: 'motorista_id', label: 'Registro Motorista' },
      { name: 'veiculo_id', label: 'Placa do Veículo' }
    ]
  },
  {
    key: 'pneus',
    label: 'Pneus',
    icon: FaTools,
    endpoint: '/api/pneus',
    keyField: 'id',
    fields: [
      { name: 'identificacao', label: 'Identificação' },
      { name: 'marca', label: 'Marca' },
      { name: 'modelo', label: 'Modelo' },
      { name: 'medidas', label: 'Medidas' },
      { name: 'dot', label: 'DOT' },
      { name: 'posicao', label: 'Posição', type: 'select', options: ['dianteiro_esq', 'dianteiro_dir', 'traseiro_esq', 'traseiro_dir', 'estepe', 'reserva'] },
      { name: 'km_instalacao', label: 'KM Instalação', type: 'number' },
      { name: 'data_instalacao', label: 'Data Instalação', type: 'date' },
      { name: 'km_retirada', label: 'KM Retirada', type: 'number' },
      { name: 'data_retirada', label: 'Data Retirada', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['ativo', 'reserva', 'inservivel', 'vendido'] },
      { name: 'nf', label: 'Nota Fiscal' },
      { name: 'valor', label: 'Valor', type: 'number' },
      { name: 'observacoes', label: 'Observações', type: 'textarea' },
      { name: 'path_foto', label: 'Foto', type: 'file' },
      { name: 'veiculo_id', label: 'Placa do Veículo' }
    ]
  },
  {
    key: 'vistorias',
    label: 'Checklist Vistoria',
    icon: FaClipboardList,
    endpoint: '/api/vistorias',
    keyField: 'id',
    fields: [
      { name: 'data', label: 'Data', type: 'date' },
      { name: 'tipo', label: 'Tipo', type: 'select', options: ['saida', 'retorno'] },
      { name: 'km', label: 'KM', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['ok', 'pendente', 'irregular'] },
      { name: 'observacoes', label: 'Observações', type: 'textarea' },
      { name: 'motorista_nome', label: 'Motorista' },
      { name: 'path_foto', label: 'Foto', type: 'file' },
      { name: 'veiculo_id', label: 'Placa do Veículo' }
    ]
  },
  {
    key: 'higienizacao',
    label: 'Higienização',
    sidebarHidden: true,
    endpoint: '/api/higienizacao',
    keyField: 'id',
    fields: [
      { name: 'data', label: 'Data', type: 'date' },
      { name: 'local', label: 'Local' },
      { name: 'valor', label: 'Valor', type: 'number' },
      { name: 'path_comprovante_pdf', label: 'Comprovante PDF', type: 'file' },
      { name: 'veiculo_id', label: 'Placa do Veículo' }
    ]
  },
  {
    key: 'configuracoes',
    label: 'Configurações',
    icon: FaCog,
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
    icon: FaInfoCircle,
    endpoint: '/api/versao',
    keyField: null,
    fields: []
  },
  {
    key: 'logs-auditoria',
    label: 'Logs de Auditoria',
    icon: FaClipboardList,
    description: 'Registro de todas as alterações realizadas no sistema.',
    endpoint: '/api/logs',
    keyField: 'id',
    adminOnly: true,
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
