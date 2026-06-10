const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Configuracao = sequelize.define('Configuracao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  cod_pais: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  idioma: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  culture_info: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  modelName: 'Configuracao',
  tableName: 'configuracoes',
  timestamps: false,
});

module.exports = Configuracao;
