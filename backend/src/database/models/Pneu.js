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
    references: {
      model: 'veiculos',
      key: 'placa',
    },
  },
  identificacao: DataTypes.STRING,
  marca: DataTypes.STRING,
  modelo: DataTypes.STRING,
  medidas: DataTypes.STRING,
  dot: DataTypes.STRING,
  posicao: DataTypes.STRING,
  km_instalacao: DataTypes.INTEGER,
  data_instalacao: DataTypes.STRING,
  km_retirada: DataTypes.INTEGER,
  data_retirada: DataTypes.STRING,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'ativo',
  },
  nf: DataTypes.STRING,
  valor: DataTypes.REAL,
  observacoes: DataTypes.STRING,
  path_foto: DataTypes.STRING,
}, {
  modelName: 'Pneu',
  tableName: 'pneus',
  timestamps: false,
});
module.exports = Pneu;
