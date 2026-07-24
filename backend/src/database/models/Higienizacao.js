const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Higienizacao = sequelize.define('Higienizacao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  data: DataTypes.DATEONLY,
  local: DataTypes.STRING,
  valor: DataTypes.REAL,
  path_comprovante_pdf: DataTypes.STRING,
  veiculo_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'veiculos', key: 'placa' },
    onDelete: 'CASCADE',
  },
}, {
  modelName: 'Higienizacao',
  tableName: 'higienizacao',
  timestamps: false,
});

module.exports = Higienizacao;
