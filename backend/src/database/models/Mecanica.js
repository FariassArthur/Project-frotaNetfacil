const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Mecanica = sequelize.define('Mecanica', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: DataTypes.STRING,
  endereco: DataTypes.STRING,
  numero: DataTypes.STRING,
  complemento: DataTypes.STRING,
  cep: DataTypes.STRING,
  bairro: DataTypes.STRING,
  cidade: DataTypes.STRING,
  uf: DataTypes.STRING,
  site: DataTypes.STRING,
  email: DataTypes.STRING,
  telefone1: DataTypes.STRING,
  telefone2: DataTypes.STRING,
  celular1: DataTypes.STRING,
  celular1_operadora: DataTypes.STRING,
  celular2: DataTypes.STRING,
  celular2_operadora: DataTypes.STRING,
  contatos: DataTypes.STRING,
  observacao: DataTypes.STRING,
}, {
  modelName: 'Mecanica',
  tableName: 'mecanicas',
  timestamps: false,
});

module.exports = Mecanica;
