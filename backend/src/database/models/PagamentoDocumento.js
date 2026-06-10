const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const PagamentoDocumento = sequelize.define('PagamentoDocumento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  data_pagamento: {
    type: DataTypes.STRING,
  },
  data_pagamento_s: {
    type: DataTypes.STRING,
  },
  data_vencimento: {
    type: DataTypes.STRING,
  },
  data_vencimento_s: {
    type: DataTypes.STRING,
  },
  valor: {
    type: DataTypes.REAL,
  },
  descricao: {
    type: DataTypes.STRING,
  },
  path_boleto_pdf: {
    type: DataTypes.STRING,
  },
  path_comprovante_pdf: {
    type: DataTypes.STRING,
  },
  veiculo_id: {
    type: DataTypes.STRING,
    references: {
      model: 'veiculos',
      key: 'placa',
    },
  },
}, {
  modelName: 'PagamentoDocumento',
  tableName: 'pagamento_documentos',
  timestamps: false,
});
module.exports = PagamentoDocumento;
