const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Cidade = sequelize.define('Cidade', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  uf: {
    type: DataTypes.STRING,
  },
}, {
  modelName: 'Cidade',
  tableName: 'cidades',
  timestamps: false,
});

module.exports = Cidade;
