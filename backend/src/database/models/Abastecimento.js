const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Abastecimento = sequelize.define('Abastecimento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  quantidade: {
    type: DataTypes.REAL,
  },
  combustivel_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'combustiveis',
      key: 'id',
    },
  },
  valor: {
    type: DataTypes.REAL,
  },
  km: {
    type: DataTypes.INTEGER,
  },
  tanque_cheio: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  path_comprovante_pdf: {
    type: DataTypes.STRING,
  },
  data: {
    type: DataTypes.STRING,
  },
  data_s: {
    type: DataTypes.STRING,
  },
  veiculo_id: {
    type: DataTypes.STRING,
    references: {
      model: 'veiculos',
      key: 'placa',
    },
  },
}, {
  modelName: 'Abastecimento',
  tableName: 'abastecimentos',
  timestamps: false,
});
module.exports = Abastecimento;
