const { Veiculo } = require('../../database/models');
const { filePathFor } = require('../../middleware/upload');
const { logAudit } = require('../../services/auditLog');
const { handleError } = require('../../services/errorHandler');

const SENSITIVE_FIELDS = ['password'];

function cleanData(data) {
  if (!data) return null;
  const cleaned = { ...data };
  SENSITIVE_FIELDS.forEach((f) => delete cleaned[f]);
  return cleaned;
}

function val(body, camel, snake) {
  return body[camel] !== undefined ? body[camel] : body[snake];
}

function parseBoolean(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'boolean') return value;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function parseInteger(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildVeiculoData(body, req, includePlaca) {
  const pathDocumentoPDF = filePathFor('pathDocumentoPDF', req) || val(body, 'pathDocumentoPDF', 'path_documento_pdf') || null;
  return {
    numero: val(body, 'numero', 'numero') || null,
    tipo: val(body, 'tipo', 'tipo') || null,
    fipe_name_marca: val(body, 'fipeNameMarca', 'fipe_name_marca') || null,
    fipe_modelo: val(body, 'fipeModelo', 'fipe_modelo') || null,
    fipe_name_ano: val(body, 'fipeNameAno', 'fipe_name_ano') || null,
    renavam: val(body, 'renavam', 'renavam') || null,
    chassi: val(body, 'chassi', 'chassi') || null,
    combustivel: parseInteger(val(body, 'combustivel', 'combustivel')),
    ano_fab: val(body, 'anoFab', 'ano_fab') || null,
    ano_modelo: val(body, 'anoModelo', 'ano_modelo') || null,
    capacidade: val(body, 'capacidade', 'capacidade') || null,
    cor: val(body, 'cor', 'cor') || null,
    cidade: val(body, 'cidade', 'cidade') || null,
    cidade_id: parseInteger(val(body, 'cidadeId', 'cidade_id')),
    uf: val(body, 'uf', 'uf') || null,
    cpfcnpj: val(body, 'cpfcnpj', 'cpfcnpj') || null,
    categoria: val(body, 'categoria', 'categoria') || null,
    km: parseInteger(val(body, 'km', 'km')),
    nome_endereco: val(body, 'nomeEndereco', 'nome_endereco') || null,
    data_aquisicao: val(body, 'dataAquisicao', 'data_aquisicao') || null,
    observacao: val(body, 'observacao', 'observacao') || null,
    potencia: val(body, 'potencia', 'potencia') || null,
    culture_info: val(body, 'cultureInfo', 'culture_info') || null,
    medidas_pneus: val(body, 'medidasPneus', 'medidas_pneus') || null,
    codigo_postal: val(body, 'codigoPostal', 'codigo_postal') || null,
    path_documento_pdf: pathDocumentoPDF,
    data_vencimento_ipva: val(body, 'dataVencimentoIPVA', 'data_vencimento_ipva') || null,
    ativo: parseBoolean(val(body, 'ativo', 'ativo')) ? 1 : 0,
    ...(includePlaca ? { placa: val(body, 'placa', 'placa') } : {}),
  };
}

async function list(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query._page, 10) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query._limit, 10) || 200));
    const offset = (page - 1) * limit;
    const result = await Veiculo.findAndCountAll({ limit, offset, order: [['placa', 'ASC']] });
    res.set('X-Total-Count', String(result.count));
    res.json(result.rows);
  } catch (error) { handleError(res, error, 'veiculos'); }
}

async function get(req, res) {
  try {
    const veiculo = await Veiculo.findByPk(req.params.placa);
    if (!veiculo) return res.status(404).json({ error: 'Veículo não encontrado' });
    res.json(veiculo);
  } catch (error) { handleError(res, error, 'veiculos'); }
}

async function create(req, res) {
  const body = req.body || {};
  try {
    const placa = val(body, 'placa', 'placa');
    if (!placa) return res.status(400).json({ error: 'placa é obrigatória' });
    await Veiculo.create(buildVeiculoData(body, req, true));
    res.status(201).json({ ok: true });
    logAudit({
      user_id: req.user?.id, username: req.user?.username, acao: 'criou', entidade: 'Veículo',
      entidade_id: placa, descricao: `Veículo ${placa} criado`, dados_novos: cleanData(body), ip: req.ip,
    }).catch(err => console.error('Audit log error:', err));
  } catch (error) { handleError(res, error, 'veiculos'); }
}

async function update(req, res) {
  const body = req.body || {};
  try {
    const placa = req.params.placa;
    if (!placa) return res.status(400).json({ error: 'placa inválida' });
    const veiculo = await Veiculo.findByPk(placa);
    if (!veiculo) return res.status(404).json({ error: 'Veículo não encontrado' });
    await Veiculo.update(buildVeiculoData(body, req, false), { where: { placa } });
    res.json({ ok: true });
    logAudit({
      user_id: req.user?.id, username: req.user?.username, acao: 'atualizou', entidade: 'Veículo',
      entidade_id: placa, descricao: `Veículo ${placa} atualizado`,
      dados_antigos: cleanData(veiculo.toJSON()), dados_novos: cleanData(body), ip: req.ip,
    }).catch(err => console.error('Audit log error:', err));
  } catch (error) { handleError(res, error, 'veiculos'); }
}

async function remove(req, res) {
  const placa = req.params.placa;
  try {
    const veiculo = await Veiculo.findByPk(placa);
    if (!veiculo) return res.status(404).json({ error: 'Veículo não encontrado' });
    await Veiculo.destroy({ where: { placa } });
    res.json({ ok: true });
    logAudit({
      user_id: req.user?.id, username: req.user?.username, acao: 'excluiu', entidade: 'Veículo',
      entidade_id: placa, descricao: `Veículo ${placa} excluído`,
      dados_antigos: cleanData(veiculo.toJSON()), ip: req.ip,
    }).catch(err => console.error('Audit log error:', err));
  } catch (error) { handleError(res, error, 'veiculos'); }
}

module.exports = { list, get, create, update, remove };
