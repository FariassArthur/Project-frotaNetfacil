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
    allowNull: false,
    references: { model: 'veiculos', key: 'placa' },
    onDelete: 'CASCADE',
  },
  tipo: {
    type: DataTypes.STRING,
    defaultValue: 'saida',
    validate: { isIn: [['saida', 'retorno']] },
  },
  data: DataTypes.DATEONLY,
  km: DataTypes.INTEGER,
  itens: DataTypes.JSONB,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'ok',
    validate: { isIn: [['ok', 'pendente', 'com_pendencia']] },
  },
  observacoes: DataTypes.TEXT,
  motorista_nome: DataTypes.STRING,
  path_foto: DataTypes.STRING,
}, {
  modelName: 'Vistoria',
  tableName: 'vistorias',
  timestamps: false,
});

module.exports = Vistoria;
