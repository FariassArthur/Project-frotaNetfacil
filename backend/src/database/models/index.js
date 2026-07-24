const Combustivel = require('./Combustivel');
const Cidade = require('./Cidade');
const Veiculo = require('./Veiculo');
const Cnh = require('./Cnh');
const Mecanica = require('./Mecanica');
const TipoManutencao = require('./TipoManutencao');
const Manutencao = require('./Manutencao');
const Multa = require('./Multa');
const Seguradora = require('./Seguradora');
const ContratoSeguro = require('./ContratoSeguro');
const PagamentoSeguro = require('./PagamentoSeguro');
const PagamentoDocumento = require('./PagamentoDocumento');
const Higienizacao = require('./Higienizacao');
const Abastecimento = require('./Abastecimento');
const Viagem = require('./Viagem');
const ConfigManutencaoPreventiva = require('./ConfigManutencaoPreventiva');
const Vistoria = require('./Vistoria');
const Pneu = require('./Pneu');
const OrdemServico = require('./OrdemServico');
const Versao = require('./Versao');
const Configuracao = require('./Configuracao');
const Usuario = require('./Usuario');
const LogAuditoria = require('./LogAuditoria');
const TokenBlacklist = require('./TokenBlacklist');

// Veiculo associations
Veiculo.belongsTo(Combustivel, { foreignKey: 'combustivel', as: 'combustivelRef' });
Veiculo.belongsTo(Cidade, { foreignKey: 'cidade_id', as: 'cidadeRef' });
Combustivel.hasMany(Veiculo, { foreignKey: 'combustivel', as: 'veiculos' });
Cidade.hasMany(Veiculo, { foreignKey: 'cidade_id', as: 'veiculos' });

// Veiculo hasMany reverse associations
Veiculo.hasMany(Cnh, { foreignKey: 'veiculo_id', as: 'cnhs' });
Veiculo.hasMany(Manutencao, { foreignKey: 'veiculo_id', as: 'manutencoes' });
Veiculo.hasMany(Multa, { foreignKey: 'veiculo_id', as: 'multas' });
Veiculo.hasMany(ContratoSeguro, { foreignKey: 'veiculo_id', as: 'contratosSeguro' });
Veiculo.hasMany(PagamentoSeguro, { foreignKey: 'veiculo_id', as: 'pagamentosSeguro' });
Veiculo.hasMany(PagamentoDocumento, { foreignKey: 'veiculo_id', as: 'pagamentoDocumentos' });
Veiculo.hasMany(Higienizacao, { foreignKey: 'veiculo_id', as: 'higienizacoes' });
Veiculo.hasMany(Abastecimento, { foreignKey: 'veiculo_id', as: 'abastecimentos' });
Veiculo.hasMany(Viagem, { foreignKey: 'veiculo_id', as: 'viagens' });
Veiculo.hasMany(ConfigManutencaoPreventiva, { foreignKey: 'veiculo_id', as: 'configManutencaoPreventiva' });
Veiculo.hasMany(Vistoria, { foreignKey: 'veiculo_id', as: 'vistorias' });
Veiculo.hasMany(Pneu, { foreignKey: 'veiculo_id', as: 'pneus' });
Veiculo.hasMany(OrdemServico, { foreignKey: 'veiculo_id', as: 'ordensServico' });

// Cnh
Cnh.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa', as: 'veiculo' });

// Manutencao
Manutencao.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa', as: 'veiculo' });
Manutencao.belongsTo(Mecanica, { foreignKey: 'mecanica_id', as: 'mecanica' });
Manutencao.belongsTo(TipoManutencao, { foreignKey: 'tipo_manutencao_id', as: 'tipoManutencao' });
Mecanica.hasMany(Manutencao, { foreignKey: 'mecanica_id', as: 'manutencoes' });
TipoManutencao.hasMany(Manutencao, { foreignKey: 'tipo_manutencao_id', as: 'manutencoes' });

// Multa
Multa.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa', as: 'veiculo' });
Multa.belongsTo(Cnh, { foreignKey: 'motorista_id', targetKey: 'numero_registro', as: 'motorista' });
Cnh.hasMany(Multa, { foreignKey: 'motorista_id', as: 'multas' });

// ContratoSeguro
ContratoSeguro.belongsTo(Seguradora, { foreignKey: 'seguradora_id', as: 'seguradora' });
ContratoSeguro.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa', as: 'veiculo' });
Seguradora.hasMany(ContratoSeguro, { foreignKey: 'seguradora_id', as: 'contratos' });

// PagamentoSeguro
PagamentoSeguro.belongsTo(ContratoSeguro, { foreignKey: 'contrato_seguro_id', as: 'contratoSeguro' });
PagamentoSeguro.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa', as: 'veiculo' });
ContratoSeguro.hasMany(PagamentoSeguro, { foreignKey: 'contrato_seguro_id', as: 'pagamentos' });

// PagamentoDocumento
PagamentoDocumento.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa', as: 'veiculo' });

// Higienizacao
Higienizacao.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa', as: 'veiculo' });

// Abastecimento
Abastecimento.belongsTo(Combustivel, { foreignKey: 'combustivel_id', as: 'combustivelRef' });
Abastecimento.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa', as: 'veiculo' });
Combustivel.hasMany(Abastecimento, { foreignKey: 'combustivel_id', as: 'abastecimentos' });

// Viagem
Viagem.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa', as: 'veiculo' });
Viagem.belongsTo(Cnh, { foreignKey: 'motorista_id', targetKey: 'numero_registro', as: 'motorista' });
Cnh.hasMany(Viagem, { foreignKey: 'motorista_id', as: 'viagens' });

// ConfigManutencaoPreventiva
ConfigManutencaoPreventiva.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa', as: 'veiculo' });
ConfigManutencaoPreventiva.belongsTo(TipoManutencao, { foreignKey: 'tipo_manutencao_id', as: 'tipoManutencao' });
TipoManutencao.hasMany(ConfigManutencaoPreventiva, { foreignKey: 'tipo_manutencao_id', as: 'configs' });

// Vistoria
Vistoria.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa', as: 'veiculo' });

// Pneu
Pneu.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa', as: 'veiculo' });

// OrdemServico
OrdemServico.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa', as: 'veiculo' });
OrdemServico.belongsTo(Mecanica, { foreignKey: 'mecanica_id', as: 'mecanica' });
OrdemServico.belongsTo(Usuario, { foreignKey: 'criado_por', targetKey: 'username', as: 'criador' });
Mecanica.hasMany(OrdemServico, { foreignKey: 'mecanica_id', as: 'ordensServico' });
Usuario.hasMany(OrdemServico, { foreignKey: 'criado_por', as: 'ordensServico' });

module.exports = {
  Combustivel, Cidade, Veiculo, Cnh, Mecanica, TipoManutencao,
  Manutencao, Multa, Seguradora, ContratoSeguro, PagamentoSeguro,
  PagamentoDocumento, Higienizacao, Abastecimento, Viagem,
  ConfigManutencaoPreventiva, Vistoria, Pneu, OrdemServico,
  Versao, Configuracao, Usuario, LogAuditoria, TokenBlacklist,
};
