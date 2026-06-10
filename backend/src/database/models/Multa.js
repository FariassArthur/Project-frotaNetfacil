const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Multa = sequelize.define('Multa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  data_ocorrencia: DataTypes.STRING,
  data_ocorrencia_s: DataTypes.STRING,
  local_ocorrencia: DataTypes.STRING,
  data_vencimento: DataTypes.STRING,
  data_vencimento_s: DataTypes.STRING,
  data_pagamento: DataTypes.STRING,
  data_pagamento_s: DataTypes.STRING,
  valor: DataTypes.REAL,
  path_anexo_multa_pdf: DataTypes.STRING,
  pagamento_realizado: DataTypes.INTEGER,
  veiculo_id: {
    type: DataTypes.STRING,
    references: {
      model: 'veiculos',
      key: 'placa',
    },
  },
  motorista_id: {
    type: DataTypes.STRING,
    references: {
      model: 'cnhs',
      key: 'numero_registro',
    },
  },
}, {
  modelName: 'Multa',
  tableName: 'multas',
  timestamps: false,
});
module.exports = Multa;
