const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Combustivel = sequelize.define('Combustivel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tipo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  modelName: 'Combustivel',
  tableName: 'combustiveis',
  timestamps: false,
});

module.exports = Combustivel;
