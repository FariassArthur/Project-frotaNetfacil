const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const OrdemServico = sequelize.define('OrdemServico', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  veiculo_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'veiculos',
      key: 'placa',
    },
  },
  numero_os: DataTypes.STRING,
  data_abertura: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  data_conclusao: DataTypes.STRING,
  km_atual: DataTypes.INTEGER,
  descricao: DataTypes.STRING,
  tipo: {
    type: DataTypes.STRING,
    defaultValue: 'corretiva',
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'aberta',
  },
  prioridade: {
    type: DataTypes.STRING,
    defaultValue: 'normal',
  },
  mecanica_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'mecanicas',
      key: 'id',
    },
  },
  valor_mao_obra: DataTypes.REAL,
  valor_pecas: DataTypes.REAL,
  observacoes: DataTypes.STRING,
  criado_por: {
    type: DataTypes.STRING,
    references: {
      model: 'usuarios',
      key: 'username',
    },
  },
}, {
  modelName: 'OrdemServico',
  tableName: 'ordens_servico',
  timestamps: false,
});

module.exports = OrdemServico;
