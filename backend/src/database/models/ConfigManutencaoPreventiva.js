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
    references: {
      model: 'veiculos',
      key: 'placa',
    },
  },
  tipo_manutencao_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'tipo_manutencao',
      key: 'id',
    },
  },
  descricao: DataTypes.STRING,
  km_intervalo: DataTypes.INTEGER,
  km_proxima: DataTypes.INTEGER,
  meses_intervalo: DataTypes.INTEGER,
  data_proxima: DataTypes.STRING,
  ativo: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
}, {
  modelName: 'ConfigManutencaoPreventiva',
  tableName: 'config_manutencao_preventiva',
  timestamps: false,
});
module.exports = ConfigManutencaoPreventiva;
