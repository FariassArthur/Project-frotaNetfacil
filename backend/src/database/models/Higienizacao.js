const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Higienizacao = sequelize.define('Higienizacao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  data: {
    type: DataTypes.STRING,
  },
  local: {
    type: DataTypes.STRING,
  },
  valor: {
    type: DataTypes.REAL,
  },
  path_comprovante_pdf: {
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
  modelName: 'Higienizacao',
  tableName: 'higienizacao',
  timestamps: false,
});
module.exports = Higienizacao;
