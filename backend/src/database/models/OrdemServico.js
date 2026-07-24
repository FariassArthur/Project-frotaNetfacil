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
    references: { model: 'veiculos', key: 'placa' },
    onDelete: 'CASCADE',
  },
  numero_os: DataTypes.STRING,
  data_abertura: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  data_conclusao: DataTypes.DATEONLY,
  km_atual: DataTypes.INTEGER,
  descricao: DataTypes.TEXT,
  tipo: {
    type: DataTypes.STRING,
    defaultValue: 'corretiva',
    validate: { isIn: [['corretiva', 'preventiva', 'preditiva']] },
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'aberta',
    validate: { isIn: [['aberta', 'em_andamento', 'concluida', 'cancelada']] },
  },
  prioridade: {
    type: DataTypes.STRING,
    defaultValue: 'normal',
    validate: { isIn: [['baixa', 'normal', 'alta', 'urgente']] },
  },
  mecanica_id: {
    type: DataTypes.INTEGER,
    references: { model: 'mecanicas', key: 'id' },
    onDelete: 'SET NULL',
  },
  valor_mao_obra: DataTypes.REAL,
  valor_pecas: DataTypes.REAL,
  observacoes: DataTypes.TEXT,
  criado_por: {
    type: DataTypes.STRING,
    references: { model: 'usuarios', key: 'username' },
    onDelete: 'SET NULL',
  },
}, {
  modelName: 'OrdemServico',
  tableName: 'ordens_servico',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = OrdemServico;
