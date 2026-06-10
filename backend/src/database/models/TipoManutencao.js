const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const TipoManutencao = sequelize.define('TipoManutencao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  descricao: DataTypes.STRING,
}, {
  modelName: 'TipoManutencao',
  tableName: 'tipo_manutencao',
  timestamps: false,
});

module.exports = TipoManutencao;
