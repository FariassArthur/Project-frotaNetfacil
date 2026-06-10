const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const ContratoSeguro = sequelize.define('ContratoSeguro', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  numero_apolice: {
    type: DataTypes.STRING,
  },
  data_inicial_contrato: {
    type: DataTypes.STRING,
  },
  data_final_contrato: {
    type: DataTypes.STRING,
  },
  ativo: {
    type: DataTypes.INTEGER,
  },
  path_orcamento_pdf: {
    type: DataTypes.STRING,
  },
  path_contrato_pdf: {
    type: DataTypes.STRING,
  },
  path_cartao_pdf: {
    type: DataTypes.STRING,
  },
  seguradora_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'seguradoras',
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
  modelName: 'ContratoSeguro',
  tableName: 'contratos_seguro',
  timestamps: false,
});
module.exports = ContratoSeguro;
