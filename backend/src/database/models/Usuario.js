const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user',
  },
  ativo: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  permissoes: {
    type: DataTypes.STRING,
    defaultValue: 'all',
  },
  nome_completo: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  email: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  telefone: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
}, {
  modelName: 'Usuario',
  tableName: 'usuarios',
  timestamps: false,
});

module.exports = Usuario;
