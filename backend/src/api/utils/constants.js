const ENTITY_LABELS = {
  veiculos: 'Veículo',
  cnhs: 'CNH',
  mecanicas: 'Mecânica',
  tipo_manutencao: 'Tipo de Manutenção',
  manutencoes: 'Manutenção',
  multas: 'Multa',
  seguradoras: 'Seguradora',
  contratos_seguro: 'Contrato de Seguro',
  pagamentos_seguro: 'Pagamento de Seguro',
  pagamento_documentos: 'Pagamento de Documento',
  higienizacao: 'Higienização',
  abastecimentos: 'Abastecimento',
  viagens: 'Viagem',
  config_manutencao_preventiva: 'Config. Manutenção Preventiva',
  vistorias: 'Vistoria',
  pneus: 'Pneu',
  ordens_servico: 'Ordem de Serviço',
  usuarios: 'Usuário',
  combustiveis: 'Combustível',
  cidades: 'Cidade',
  configuracoes: 'Configuração',
  versoes: 'Versão',
  logs_auditoria: 'Log de Auditoria',
  token_blacklist: 'Token Blacklist',
};

const ALLOWED_TABLES = new Set([
  'veiculos', 'cnhs', 'mecanicas', 'tipo_manutencao', 'manutencoes',
  'multas', 'seguradoras', 'contratos_seguro', 'pagamentos_seguro',
  'pagamento_documentos', 'higienizacao', 'abastecimentos', 'viagens',
  'config_manutencao_preventiva', 'vistorias', 'pneus', 'ordens_servico',
  'usuarios', 'combustiveis', 'cidades', 'configuracoes', 'versoes',
  'logs_auditoria',
]);

const SENSITIVE_FIELDS = ['password'];

const OS_STATUSES = ['aberta', 'em_andamento', 'concluida', 'cancelada'];
const OS_TYPES = ['corretiva', 'preventiva', 'preditiva'];
const OS_PRIORITIES = ['baixa', 'normal', 'alta', 'urgente'];
const PNEU_STATUSES = ['instalado', 'retirado', 'estoque', 'em_manutencao'];
const VIAGEM_STATUSES = ['em_andamento', 'concluida', 'cancelada'];
const VISTORIA_TYPES = ['saida', 'retorno'];
const VISTORIA_STATUSES = ['ok', 'pendente', 'com_pendencia'];
const MANUTENCAO_CLASSIFICACOES = ['preventiva', 'corretiva', 'preditiva'];

module.exports = {
  ENTITY_LABELS,
  ALLOWED_TABLES,
  SENSITIVE_FIELDS,
  OS_STATUSES,
  OS_TYPES,
  OS_PRIORITIES,
  PNEU_STATUSES,
  VIAGEM_STATUSES,
  VISTORIA_TYPES,
  VISTORIA_STATUSES,
  MANUTENCAO_CLASSIFICACOES,
};
