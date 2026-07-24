const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Manutencao = sequelize.define('Manutencao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  data: DataTypes.DATEONLY,
  data_s: DataTypes.STRING,
  valor: DataTypes.REAL,
  descricao: DataTypes.TEXT,
  km: DataTypes.INTEGER,
  classificacao: {
    type: DataTypes.STRING,
    defaultValue: 'preventiva',
    validate: {
      isIn: [['preventiva', 'corretiva', 'preditiva']],
    },
  },
  path_comprovante_pdf: DataTypes.STRING,
  veiculo_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'veiculos', key: 'placa' },
    onDelete: 'CASCADE',
  },
  mecanica_id: {
    type: DataTypes.INTEGER,
    references: { model: 'mecanicas', key: 'id' },
    onDelete: 'SET NULL',
  },
  tipo_manutencao_id: {
    type: DataTypes.INTEGER,
    references: { model: 'tipo_manutencao', key: 'id' },
    onDelete: 'SET NULL',
  },
}, {
  modelName: 'Manutencao',
  tableName: 'manutencoes',
  timestamps: false,
});

module.exports = Manutencao;
