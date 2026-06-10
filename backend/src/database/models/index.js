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

Veiculo.belongsTo(Combustivel, { foreignKey: 'combustivel' });
Veiculo.belongsTo(Cidade, { foreignKey: 'cidade_id' });
Combustivel.hasMany(Veiculo, { foreignKey: 'combustivel' });

Cnh.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa' });

Manutencao.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa' });
Manutencao.belongsTo(Mecanica, { foreignKey: 'mecanica_id' });
Manutencao.belongsTo(TipoManutencao, { foreignKey: 'tipo_manutencao_id' });

Multa.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa' });
Multa.belongsTo(Cnh, { foreignKey: 'motorista_id', targetKey: 'numero_registro' });

ContratoSeguro.belongsTo(Seguradora, { foreignKey: 'seguradora_id' });
ContratoSeguro.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa' });

PagamentoSeguro.belongsTo(ContratoSeguro, { foreignKey: 'contrato_seguro_id' });
PagamentoSeguro.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa' });

PagamentoDocumento.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa' });

Higienizacao.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa' });

Abastecimento.belongsTo(Combustivel, { foreignKey: 'combustivel_id' });
Abastecimento.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa' });

Viagem.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa' });
Viagem.belongsTo(Cnh, { foreignKey: 'motorista_id', targetKey: 'numero_registro' });

ConfigManutencaoPreventiva.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa' });
ConfigManutencaoPreventiva.belongsTo(TipoManutencao, { foreignKey: 'tipo_manutencao_id' });

Vistoria.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa' });

Pneu.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa' });

OrdemServico.belongsTo(Veiculo, { foreignKey: 'veiculo_id', targetKey: 'placa' });
OrdemServico.belongsTo(Mecanica, { foreignKey: 'mecanica_id' });
OrdemServico.belongsTo(Usuario, { foreignKey: 'criado_por', targetKey: 'username' });

module.exports = {
  Combustivel, Cidade, Veiculo, Cnh, Mecanica, TipoManutencao,
  Manutencao, Multa, Seguradora, ContratoSeguro, PagamentoSeguro,
  PagamentoDocumento, Higienizacao, Abastecimento, Viagem,
  ConfigManutencaoPreventiva, Vistoria, Pneu, OrdemServico,
  Versao, Configuracao, Usuario, LogAuditoria, TokenBlacklist,
};
