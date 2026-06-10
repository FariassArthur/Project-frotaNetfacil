const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Viagem = sequelize.define('Viagem', {
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
  motorista_id: {
    type: DataTypes.STRING,
    references: {
      model: 'cnhs',
      key: 'numero_registro',
    },
  },
  data_saida: {
    type: DataTypes.STRING,
  },
  data_saida_s: {
    type: DataTypes.STRING,
  },
  data_retorno: {
    type: DataTypes.STRING,
  },
  data_retorno_s: {
    type: DataTypes.STRING,
  },
  km_inicial: {
    type: DataTypes.INTEGER,
  },
  km_final: {
    type: DataTypes.INTEGER,
  },
  destino: {
    type: DataTypes.STRING,
  },
  descricao: {
    type: DataTypes.STRING,
  },
}, {
  modelName: 'Viagem',
  tableName: 'viagens',
  timestamps: false,
});
module.exports = Viagem;
