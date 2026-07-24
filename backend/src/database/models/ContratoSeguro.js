const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const ContratoSeguro = sequelize.define('ContratoSeguro', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  numero_apolice: DataTypes.STRING,
  data_inicial_contrato: DataTypes.DATEONLY,
  data_final_contrato: DataTypes.DATEONLY,
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  path_orcamento_pdf: DataTypes.STRING,
  path_contrato_pdf: DataTypes.STRING,
  path_cartao_pdf: DataTypes.STRING,
  seguradora_id: {
    type: DataTypes.INTEGER,
    references: { model: 'seguradoras', key: 'id' },
    onDelete: 'SET NULL',
  },
  veiculo_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'veiculos', key: 'placa' },
    onDelete: 'CASCADE',
  },
}, {
  modelName: 'ContratoSeguro',
  tableName: 'contratos_seguro',
  timestamps: false,
});

module.exports = ContratoSeguro;
