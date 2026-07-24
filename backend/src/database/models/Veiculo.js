const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Veiculo = sequelize.define('Veiculo', {
  placa: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  numero: DataTypes.STRING,
  tipo: DataTypes.STRING,
  fipe_name_marca: DataTypes.STRING,
  fipe_modelo: DataTypes.STRING,
  fipe_name_ano: DataTypes.STRING,
  renavam: DataTypes.STRING,
  chassi: DataTypes.STRING,
  combustivel: {
    type: DataTypes.INTEGER,
    references: { model: 'combustiveis', key: 'id' },
    onDelete: 'SET NULL',
  },
  ano_fab: DataTypes.STRING,
  ano_modelo: DataTypes.STRING,
  capacidade: DataTypes.STRING,
  cor: DataTypes.STRING,
  cidade: DataTypes.STRING,
  cidade_id: {
    type: DataTypes.INTEGER,
    references: { model: 'cidades', key: 'id' },
    onDelete: 'SET NULL',
  },
  uf: DataTypes.STRING,
  cpfcnpj: DataTypes.STRING,
  categoria: DataTypes.STRING,
  km: DataTypes.INTEGER,
  nome_endereco: DataTypes.STRING,
  data_aquisicao: DataTypes.DATEONLY,
  observacao: DataTypes.TEXT,
  potencia: DataTypes.STRING,
  culture_info: DataTypes.STRING,
  medidas_pneus: DataTypes.STRING,
  codigo_postal: DataTypes.STRING,
  path_documento_pdf: DataTypes.STRING,
  data_vencimento_ipva: DataTypes.DATEONLY,
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  modelName: 'Veiculo',
  tableName: 'veiculos',
  timestamps: false,
});

module.exports = Veiculo;
