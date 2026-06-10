const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Manutencao = sequelize.define('Manutencao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  data: DataTypes.STRING,
  data_s: DataTypes.STRING,
  valor: DataTypes.REAL,
  descricao: DataTypes.STRING,
  km: DataTypes.INTEGER,
  classificacao: {
    type: DataTypes.STRING,
    defaultValue: 'preventiva',
  },
  path_comprovante_pdf: DataTypes.STRING,
  veiculo_id: {
    type: DataTypes.STRING,
    references: {
      model: 'veiculos',
      key: 'placa',
    },
  },
  mecanica_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'mecanicas',
      key: 'id',
    },
  },
  tipo_manutencao_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'tipo_manutencao',
      key: 'id',
    },
  },
}, {
  modelName: 'Manutencao',
  tableName: 'manutencoes',
  timestamps: false,
});
module.exports = Manutencao;
