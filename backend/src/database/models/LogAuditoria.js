const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const LogAuditoria = sequelize.define('LogAuditoria', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: DataTypes.INTEGER,
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  acao: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entidade: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entidade_id: DataTypes.STRING,
  descricao: DataTypes.STRING,
  dados_antigos: DataTypes.STRING,
  dados_novos: DataTypes.STRING,
  ip: DataTypes.STRING,
  created_at: DataTypes.STRING,
}, {
  modelName: 'LogAuditoria',
  tableName: 'logs_auditoria',
  timestamps: false,
});

module.exports = LogAuditoria;
