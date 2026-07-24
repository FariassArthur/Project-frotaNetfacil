const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Pneu = sequelize.define('Pneu', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  veiculo_id: {
    type: DataTypes.STRING,
    references: { model: 'veiculos', key: 'placa' },
    onDelete: 'SET NULL',
  },
  identificacao: DataTypes.STRING,
  marca: DataTypes.STRING,
  modelo: DataTypes.STRING,
  medidas: DataTypes.STRING,
  dot: DataTypes.STRING,
  posicao: DataTypes.STRING,
  km_instalacao: DataTypes.INTEGER,
  data_instalacao: DataTypes.DATEONLY,
  km_retirada: DataTypes.INTEGER,
  data_retirada: DataTypes.DATEONLY,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'estoque',
    validate: { isIn: [['instalado', 'retirado', 'estoque', 'em_manutencao']] },
  },
  nf: DataTypes.STRING,
  valor: DataTypes.REAL,
  observacoes: DataTypes.TEXT,
  path_foto: DataTypes.STRING,
}, {
  modelName: 'Pneu',
  tableName: 'pneus',
  timestamps: false,
});

module.exports = Pneu;
