const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Vistoria = sequelize.define('Vistoria', {
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
  tipo: {
    type: DataTypes.STRING,
    defaultValue: 'saida',
  },
  data: DataTypes.STRING,
  km: DataTypes.INTEGER,
  itens: DataTypes.STRING,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'ok',
  },
  observacoes: DataTypes.STRING,
  motorista_nome: DataTypes.STRING,
  path_foto: DataTypes.STRING,
}, {
  modelName: 'Vistoria',
  tableName: 'vistorias',
  timestamps: false,
});
module.exports = Vistoria;
