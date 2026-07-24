const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const PagamentoSeguro = sequelize.define('PagamentoSeguro', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  data_pagamento: DataTypes.DATEONLY,
  valor: DataTypes.REAL,
  path_pagamento_pdf: DataTypes.STRING,
  contrato_seguro_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'contratos_seguro', key: 'id' },
    onDelete: 'CASCADE',
  },
  veiculo_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'veiculos', key: 'placa' },
    onDelete: 'CASCADE',
  },
}, {
  modelName: 'PagamentoSeguro',
  tableName: 'pagamentos_seguro',
  timestamps: false,
});

module.exports = PagamentoSeguro;
