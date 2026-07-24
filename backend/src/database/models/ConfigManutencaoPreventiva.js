const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const ConfigManutencaoPreventiva = sequelize.define('ConfigManutencaoPreventiva', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  veiculo_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'veiculos', key: 'placa' },
    onDelete: 'CASCADE',
  },
  tipo_manutencao_id: {
    type: DataTypes.INTEGER,
    references: { model: 'tipo_manutencao', key: 'id' },
    onDelete: 'SET NULL',
  },
  descricao: DataTypes.STRING,
  km_intervalo: DataTypes.INTEGER,
  km_proxima: DataTypes.INTEGER,
  meses_intervalo: DataTypes.INTEGER,
  data_proxima: DataTypes.DATEONLY,
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  modelName: 'ConfigManutencaoPreventiva',
  tableName: 'config_manutencao_preventiva',
  timestamps: false,
});

module.exports = ConfigManutencaoPreventiva;
