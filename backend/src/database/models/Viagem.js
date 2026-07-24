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
    allowNull: false,
    references: { model: 'veiculos', key: 'placa' },
    onDelete: 'CASCADE',
  },
  motorista_id: {
    type: DataTypes.STRING,
    references: { model: 'cnhs', key: 'numero_registro' },
    onDelete: 'SET NULL',
  },
  data_saida: DataTypes.DATEONLY,
  data_saida_s: DataTypes.STRING,
  data_retorno: DataTypes.DATEONLY,
  data_retorno_s: DataTypes.STRING,
  km_inicial: DataTypes.INTEGER,
  km_final: DataTypes.INTEGER,
  destino: DataTypes.STRING,
  descricao: DataTypes.TEXT,
}, {
  modelName: 'Viagem',
  tableName: 'viagens',
  timestamps: false,
});

module.exports = Viagem;
