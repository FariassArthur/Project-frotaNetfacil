const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Cnh = sequelize.define('Cnh', {
  numero_registro: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  nome: DataTypes.STRING,
  nascimento: DataTypes.STRING,
  categoria: DataTypes.STRING,
  cpf: DataTypes.STRING,
  filiacao: DataTypes.STRING,
  primeira_habilitacao: DataTypes.STRING,
  emissao: DataTypes.STRING,
  validade: DataTypes.STRING,
  local: DataTypes.STRING,
  path_documento_pdf: DataTypes.STRING,
  aivo: DataTypes.INTEGER,
  veiculo_id: {
    type: DataTypes.STRING,
    references: {
      model: 'veiculos',
      key: 'placa',
    },
  },
  path_foto: DataTypes.STRING,
}, {
  modelName: 'Cnh',
  tableName: 'cnhs',
  timestamps: false,
});
module.exports = Cnh;
