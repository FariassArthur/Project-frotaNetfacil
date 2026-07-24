const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Abastecimento = sequelize.define('Abastecimento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  quantidade: DataTypes.REAL,
  combustivel_id: {
    type: DataTypes.INTEGER,
    references: { model: 'combustiveis', key: 'id' },
    onDelete: 'SET NULL',
  },
  valor: DataTypes.REAL,
  km: DataTypes.INTEGER,
  tanque_cheio: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  path_comprovante_pdf: DataTypes.STRING,
  data: DataTypes.DATEONLY,
  data_s: DataTypes.STRING,
  veiculo_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'veiculos', key: 'placa' },
    onDelete: 'CASCADE',
  },
}, {
  modelName: 'Abastecimento',
  tableName: 'abastecimentos',
  timestamps: false,
});

module.exports = Abastecimento;
