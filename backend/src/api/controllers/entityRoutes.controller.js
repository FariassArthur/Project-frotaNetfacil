const { Op } = require('sequelize');
const models = require('../../database/models');
const { filePathFor } = require('../../middleware/upload');
const { logAudit } = require('../../services/auditLog');
const { handleError } = require('../../services/errorHandler');
const { requireRole } = require('../../middleware/auth');
const { cleanData, sanitizeSensitiveFields, buildSearchFilter, escapeLike, getEntityLabel } = require('../utils/helpers');
const { ALLOWED_TABLES, SENSITIVE_FIELDS } = require('../utils/constants');

const {
  Veiculo, Cnh, Mecanica, TipoManutencao, Manutencao, Multa,
  Seguradora, ContratoSeguro, PagamentoSeguro, PagamentoDocumento,
  Higienizacao, Abastecimento, Cidade, Viagem, Vistoria, Pneu, OrdemServico,
} = models;

const MODEL_MAP = {
  'veiculos': Veiculo, 'cnhs': Cnh, 'mecanicas': Mecanica,
  'tipo_manutencao': TipoManutencao, 'manutencoes': Manutencao, 'multas': Multa,
  'seguradoras': Seguradora, 'contratos_seguro': ContratoSeguro,
  'pagamentos_seguro': PagamentoSeguro, 'pagamento_documentos': PagamentoDocumento,
  'higienizacao': Higienizacao, 'abastecimentos': Abastecimento,
  'cidades': Cidade, 'viagens': Viagem, 'vistorias': Vistoria,
  'pneus': Pneu, 'ordens_servico': OrdemServico,
};

function getSearchFields(tableName) {
  const map = {
    veiculos: ['placa', 'numero', 'fipe_modelo', 'fipe_name_marca', 'renavam', 'chassi'],
    cnhs: ['numero_registro', 'nome', 'cpf'],
    mecanicas: ['nome', 'cidade', 'bairro'],
    manutencoes: ['descricao'],
    multas: ['local_ocorrencia'],
    seguradoras: ['nome', 'corretor', 'cidade'],
    contratos_seguro: ['numero_apolice'],
    abastecimentos: [],
    viagens: ['destino', 'descricao'],
    vistorias: ['motorista_nome'],
    pneus: ['identificacao', 'marca', 'modelo'],
    ordens_servico: ['numero_os', 'descricao'],
    pagamento_documentos: ['descricao'],
    higienizacao: ['local'],
    cidades: ['nome'],
    tipo_manutencao: ['descricao'],
    pagamentos_seguro: [],
  };
  return map[tableName] || [];
}

function createRoutesFor(app, config) {
  const { name, tableName, keyField, fields, fileFields = [] } = config;
  const prefix = `/api/${name}`;
  const Model = MODEL_MAP[tableName];
  if (!Model) {
    console.warn(`Model not found for table: ${tableName}`);
    return;
  }

  // LIST
  app.get(prefix, requireRole('admin', 'root', 'user'), async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query._limit) || 25, 200);
      const page = Math.max(parseInt(req.query._page) || 1, 1);
      const offset = (page - 1) * limit;
      const where = {};

      if (req.query._q) {
        const searchFields = getSearchFields(tableName);
        if (searchFields.length > 0) {
          const term = escapeLike(req.query._q.trim());
          where[Op.or] = searchFields.map((f) => ({ [f]: { [Op.iLike]: `%${term}%` } }));
        }
      }

      if (req.query.ativo !== undefined) {
        where.ativo = req.query.ativo === 'true' || req.query.ativo === '1';
      }

      const { count, rows } = await Model.findAndCountAll({ where, limit, offset, order: [[keyField, 'ASC']] });
      res.set('X-Total-Count', count);
      res.set('X-Page', page);
      res.set('X-Per-Page', limit);
      res.json(rows);
    } catch (err) {
      handleError(res, err, `[${name}] list`);
    }
  });

  // GET
  app.get(`${prefix}/:id`, requireRole('admin', 'root', 'user'), async (req, res) => {
    try {
      const key = req.params.id;
      const where = { [keyField]: key };
      const row = await Model.findOne({ where });
      if (!row) return res.status(404).json({ error: `${getEntityLabel(tableName)} não encontrado(a)` });
      res.json(row);
    } catch (err) {
      handleError(res, err, `[${name}] get`);
    }
  });

  // CREATE
  app.post(prefix, requireRole('admin', 'root'), async (req, res) => {
    try {
      let data = cleanData(req.body);
      for (const f of fileFields) {
        const fp = filePathFor(f, req);
        if (fp) data[f] = fp;
      }
      if (data.ativo !== undefined) data.ativo = data.ativo === true || data.ativo === 'true' || data.ativo === 1;
      const created = await Model.create(data);
      logAudit({ username: req.user?.username, acao: 'create', entidade: name, entidade_id: String(created[keyField]), dados_novos: data, ip: req.ip });
      res.status(201).json(created);
    } catch (err) {
      handleError(res, err, `[${name}] create`);
    }
  });

  // UPDATE
  app.put(`${prefix}/:id`, requireRole('admin', 'root'), async (req, res) => {
    try {
      const key = req.params.id;
      const existing = await Model.findOne({ where: { [keyField]: key } });
      if (!existing) return res.status(404).json({ error: `${getEntityLabel(tableName)} não encontrado(a)` });
      let data = cleanData(req.body);
      for (const f of fileFields) {
        const fp = filePathFor(f, req);
        if (fp) data[f] = fp;
      }
      if (data.ativo !== undefined) data.ativo = data.ativo === true || data.ativo === 'true' || data.ativo === 1;
      const dadosAntigos = existing.toJSON();
      await existing.update(data);
      logAudit({ username: req.user?.username, acao: 'update', entidade: name, entidade_id: String(key), dados_antigos: dadosAntigos, dados_novos: data, ip: req.ip });
      res.json(existing);
    } catch (err) {
      handleError(res, err, `[${name}] update`);
    }
  });

  // DELETE
  app.delete(`${prefix}/:id`, requireRole('admin', 'root'), async (req, res) => {
    try {
      const key = req.params.id;
      const existing = await Model.findOne({ where: { [keyField]: key } });
      if (!existing) return res.status(404).json({ error: `${getEntityLabel(tableName)} não encontrado(a)` });
      const dadosAntigos = existing.toJSON();
      await existing.destroy();
      logAudit({ username: req.user?.username, acao: 'delete', entidade: name, entidade_id: String(key), dados_antigos: dadosAntigos, ip: req.ip });
      res.json({ ok: true });
    } catch (err) {
      handleError(res, err, `[${name}] delete`);
    }
  });
}

module.exports = { createRoutesFor };
