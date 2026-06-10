const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const PagamentoSeguro = sequelize.define('PagamentoSeguro', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  data_pagamento: {
    type: DataTypes.STRING,
  },
  valor: {
    type: DataTypes.REAL,
  },
  path_pagamento_pdf: {
    type: DataTypes.STRING,
  },
  contrato_seguro_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'contratos_seguro',
      key: 'id',
    },
  },
  veiculo_id: {
    type: DataTypes.STRING,
    references: {
      model: 'veiculos',
      key: 'placa',
    },
  },
}, {
  modelName: 'PagamentoSeguro',
  tableName: 'pagamentos_seguro',
  timestamps: false,
});
module.exports = PagamentoSeguro;
