const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Multa = sequelize.define('Multa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  data_ocorrencia: DataTypes.DATEONLY,
  data_ocorrencia_s: DataTypes.STRING,
  local_ocorrencia: DataTypes.STRING,
  data_vencimento: DataTypes.DATEONLY,
  data_vencimento_s: DataTypes.STRING,
  data_pagamento: DataTypes.DATEONLY,
  data_pagamento_s: DataTypes.STRING,
  valor: DataTypes.REAL,
  path_anexo_multa_pdf: DataTypes.STRING,
  pagamento_realizado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  veiculo_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'veiculos', key: 'placa' },
    onDelete: 'CASCADE',
  },
  motorista_id: {
    type: DataTypes.STRING,
    references: { model: 'cnhs', key: 'numero_registro' },
    onDelete: 'SET NULL',
  },
}, {
  modelName: 'Multa',
  tableName: 'multas',
  timestamps: false,
});

module.exports = Multa;
