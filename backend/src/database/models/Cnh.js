const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Cnh = sequelize.define('Cnh', {
  numero_registro: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  nome: DataTypes.STRING,
  nascimento: DataTypes.DATEONLY,
  categoria: DataTypes.STRING,
  cpf: DataTypes.STRING,
  filiacao: DataTypes.STRING,
  primeira_habilitacao: DataTypes.DATEONLY,
  emissao: DataTypes.DATEONLY,
  validade: DataTypes.DATEONLY,
  local: DataTypes.STRING,
  path_documento_pdf: DataTypes.STRING,
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  veiculo_id: {
    type: DataTypes.STRING,
    references: { model: 'veiculos', key: 'placa' },
    onDelete: 'SET NULL',
  },
  path_foto: DataTypes.STRING,
}, {
  modelName: 'Cnh',
  tableName: 'cnhs',
  timestamps: false,
});

module.exports = Cnh;
