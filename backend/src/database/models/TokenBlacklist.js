const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const TokenBlacklist = sequelize.define('TokenBlacklist', {
  token_hash: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  expires_at: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
}, {
  modelName: 'TokenBlacklist',
  tableName: 'token_blacklist',
  timestamps: false,
});

module.exports = TokenBlacklist;
