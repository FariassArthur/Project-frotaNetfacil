const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Seguradora = sequelize.define('Seguradora', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: {
    type: DataTypes.STRING,
  },
  corretor: {
    type: DataTypes.STRING,
  },
  endereco: {
    type: DataTypes.STRING,
  },
  numero: {
    type: DataTypes.STRING,
  },
  complemento: {
    type: DataTypes.STRING,
  },
  cep: {
    type: DataTypes.STRING,
  },
  bairro: {
    type: DataTypes.STRING,
  },
  cidade: {
    type: DataTypes.STRING,
  },
  uf: {
    type: DataTypes.STRING,
  },
  site: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  telefone1: {
    type: DataTypes.STRING,
  },
  telefone2: {
    type: DataTypes.STRING,
  },
  celular1: {
    type: DataTypes.STRING,
  },
  celular1_operadora: {
    type: DataTypes.STRING,
  },
  celular2: {
    type: DataTypes.STRING,
  },
  celular2_operadora: {
    type: DataTypes.STRING,
  },
  contatos: {
    type: DataTypes.STRING,
  },
}, {
  modelName: 'Seguradora',
  tableName: 'seguradoras',
  timestamps: false,
});

module.exports = Seguradora;
