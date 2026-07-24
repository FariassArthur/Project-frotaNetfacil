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
    validate: { isIn: [['user', 'admin', 'root']] },
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  permissoes: {
    type: DataTypes.JSONB,
    defaultValue: { all: true },
  },
  nome_completo: DataTypes.STRING,
  email: DataTypes.STRING,
  telefone: DataTypes.STRING,
}, {
  modelName: 'Usuario',
  tableName: 'usuarios',
  timestamps: false,
});

module.exports = Usuario;
