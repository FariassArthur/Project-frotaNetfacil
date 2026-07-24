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
    allowNull: false,
  },
  corretor: DataTypes.STRING,
  endereco: DataTypes.STRING,
  numero: DataTypes.STRING,
  complemento: DataTypes.STRING,
  cep: DataTypes.STRING,
  bairro: DataTypes.STRING,
  cidade: DataTypes.STRING,
  uf: DataTypes.STRING(2),
  site: DataTypes.STRING,
  email: DataTypes.STRING,
  telefone1: DataTypes.STRING,
  telefone2: DataTypes.STRING,
  celular1: DataTypes.STRING,
  celular1_operadora: DataTypes.STRING,
  celular2: DataTypes.STRING,
  celular2_operadora: DataTypes.STRING,
  contatos: DataTypes.TEXT,
}, {
  modelName: 'Seguradora',
  tableName: 'seguradoras',
  timestamps: false,
});

module.exports = Seguradora;
