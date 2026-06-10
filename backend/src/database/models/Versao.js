const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Versao = sequelize.define('Versao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  version: DataTypes.STRING,
}, {
  modelName: 'Versao',
  tableName: 'versoes',
  timestamps: false,
});

module.exports = Versao;
