const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Veiculo = sequelize.define('Veiculo', {
  placa: {
    type: DataTypes.STRING,
    primaryKey: true,
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
    references: {
      model: 'combustiveis',
      key: 'id',
    },
  },
  ano_fab: DataTypes.STRING,
  ano_modelo: DataTypes.STRING,
  capacidade: DataTypes.STRING,
  cor: DataTypes.STRING,
  cidade: DataTypes.STRING,
  cidade_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'cidades',
      key: 'id',
    },
  },
  uf: DataTypes.STRING,
  cpfcnpj: DataTypes.STRING,
  categoria: DataTypes.STRING,
  km: DataTypes.INTEGER,
  nome_endereco: DataTypes.STRING,
  data_aquisicao: DataTypes.STRING,
  observacao: DataTypes.STRING,
  potencia: DataTypes.STRING,
  culture_info: DataTypes.STRING,
  medidas_pneus: DataTypes.STRING,
  codigo_postal: DataTypes.STRING,
  path_documento_pdf: DataTypes.STRING,
  data_vencimento_ipva: DataTypes.STRING,
  ativo: DataTypes.INTEGER,
}, {
  modelName: 'Veiculo',
  tableName: 'veiculos',
  timestamps: false,
});
module.exports = Veiculo;
