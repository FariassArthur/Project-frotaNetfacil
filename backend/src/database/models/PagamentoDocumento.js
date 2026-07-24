const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const PagamentoDocumento = sequelize.define('PagamentoDocumento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  data_pagamento: DataTypes.DATEONLY,
  data_pagamento_s: DataTypes.STRING,
  data_vencimento: DataTypes.DATEONLY,
  data_vencimento_s: DataTypes.STRING,
  valor: DataTypes.REAL,
  descricao: DataTypes.STRING,
  path_boleto_pdf: DataTypes.STRING,
  path_comprovante_pdf: DataTypes.STRING,
  veiculo_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'veiculos', key: 'placa' },
    onDelete: 'CASCADE',
  },
}, {
  modelName: 'PagamentoDocumento',
  tableName: 'pagamento_documentos',
  timestamps: false,
});

module.exports = PagamentoDocumento;
