const { Op } = require('sequelize');
const models = require('../../database/models');
const { filePathFor } = require('../../middleware/upload');
const { logAudit } = require('../../services/auditLog');
const { handleError } = require('../../services/errorHandler');
const { requireRole } = require('../../middleware/auth');

const {
  Veiculo, Cnh, Mecanica, TipoManutencao, Manutencao, Multa,
  Seguradora, ContratoSeguro, PagamentoSeguro, PagamentoDocumento,
  Higienizacao, Abastecimento, Cidade, Viagem, Vistoria, Pneu, OrdemServico,
} = models;

const MODEL_MAP = {
  'veiculos': Veiculo,
  'cnhs': Cnh,
  'mecanicas': Mecanica,
  'tipo_manutencao': TipoManutencao,
  'manutencoes': Manutencao,
  'multas': Multa,
  'seguradoras': Seguradora,
  'contratos_seguro': ContratoSeguro,
  'pagamentos_seguro': PagamentoSeguro,
  'pagamento_documentos': PagamentoDocumento,
  'higienizacao': Higienizacao,
  'abastecimentos': Abastecimento,
  'cidades': Cidade,
  'viagens': Viagem,
  'vistorias': Vistoria,
  'pneus': Pneu,
  'ordens_servico': OrdemServico,
};

const SENSITIVE_FIELDS = ['password'];

const ALLOWED_TABLES = {
  'veiculos': true,
  'cnhs': true,
  'mecanicas': true,
  'tipo_manutencao': true,
  'manutencoes': true,
  'multas': true,
  'seguradoras': true,
  'contratos_seguro': true,
  'pagamentos_seguro': true,
  'pagamento_documentos': true,
  'higienizacao': true,
  'abastecimentos': true,
  'cidades': true,
  'viagens': true,
  'vistorias': true,
  'pneus': true,
  'ordens_servico': true,
};

const ALLOWED_KEY_FIELDS = {
  'placa': true,
  'numero_registro': true,
  'id': true,
};

function validateTable(name) {
  if (!ALLOWED_TABLES[name]) throw new Error(`Tabela não permitida: ${name}`);
}
function validateKeyField(name) {
  if (!ALLOWED_KEY_FIELDS[name]) throw new Error(`Chave não permitida: ${name}`);
}

function cleanData(data) {
  if (!data) return null;
  const cleaned = { ...data };
  SENSITIVE_FIELDS.forEach((f) => delete cleaned[f]);
  return cleaned;
}

function validateFields(body, fields, fileFields, extraAllowedFields = []) {
  const errors = [];
  const MAX_STR_LEN = 10000;
  const allowedFields = new Set([...fields, ...extraAllowedFields]);

  for (const field of fields) {
    const val = body[field];
    if (val === undefined || val === null) continue;

    if (fileFields.includes(field)) continue;

    if (field.endsWith('_id') || field === 'id' || field.includes('km') || field === 'valor') {
      if (val !== '' && val !== null && val !== undefined) {
        const num = Number(val);
        if (!Number.isFinite(num)) {
          errors.push(`Campo '${field}' deve ser um número`);
        }
      }
    }

    if (typeof val === 'string' && val.length > MAX_STR_LEN) {
      errors.push(`Campo '${field}' excede o limite de ${MAX_STR_LEN} caracteres`);
    }
  }

  const invalidFields = Object.keys(body).filter(k => !allowedFields.has(k));
  if (invalidFields.length > 0) {
    errors.push(`Campos não permitidos: ${invalidFields.join(', ')}`);
  }

  return errors;
}

function getEntityLabel(name) {
  const labels = {
    'cnhs': 'Motorista',
    'mecanicas': 'Mecânica',
    'tipo-manutencao': 'Tipo de Manutenção',
    'manutencoes': 'Manutenção',
    'multas': 'Multa',
    'seguradoras': 'Seguradora',
    'contratos-seguro': 'Contrato de Seguro',
    'pagamentos-seguro': 'Pagamento de Seguro',
    'pagamento-documentos': 'Pagamento de Documento',
    'abastecimentos': 'Abastecimento',
  };
  return labels[name] || name;
}

function createRoutesFor(app, { name, tableName, keyField, fields, fileFields = [], adminOnly = false }) {
  validateTable(tableName);
  validateKeyField(keyField);

  const Model = MODEL_MAP[tableName];
  if (!Model) {
    throw new Error(`Modelo não encontrado para tabela: ${tableName}`);
  }

  app.get(`/api/${name}`, async (req, res) => {
    if (adminOnly && req.user?.role !== 'root' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }
    try {
      const where = {};

      if (req.query.veiculo_id) where.veiculo_id = req.query.veiculo_id;
      if (req.query.seguradora_id) where.seguradora_id = req.query.seguradora_id;
      if (req.query.contrato_seguro_id) where.contrato_seguro_id = req.query.contrato_seguro_id;
      if (req.query.motorista_id) where.motorista_id = req.query.motorista_id;

      if (req.query._q) {
        const searchable = fields.filter(f =>
          !fileFields.includes(f) && f !== keyField &&
          !f.endsWith('_id') && f !== 'id' && f !== 'ativo' &&
          f !== 'pagamento_realizado' && f !== 'aivo' && f !== 'tanque_cheio'
        );
        if (searchable.length > 0) {
          where[Op.or] = searchable.map(f => ({
            [f]: { [Op.like]: `%${req.query._q}%` }
          }));
        }
      }

      Object.keys(req.query).forEach(key => {
        const startMatch = key.match(/^(.+)_start$/);
        if (startMatch && fields.includes(startMatch[1])) {
          where[startMatch[1]] = where[startMatch[1]] || {};
          where[startMatch[1]][Op.gte] = req.query[key];
        }
        const endMatch = key.match(/^(.+)_end$/);
        if (endMatch && fields.includes(endMatch[1])) {
          where[endMatch[1]] = where[endMatch[1]] || {};
          where[endMatch[1]][Op.lte] = req.query[key] + ' 23:59:59';
        }
      });

      const page = Math.max(1, parseInt(req.query._page, 10) || 1);
      const limit = Math.min(500, Math.max(1, parseInt(req.query._limit, 10) || 200));
      const offset = (page - 1) * limit;

      const { rows, count } = await Model.findAndCountAll({
        where,
        order: [[keyField, 'ASC']],
        limit,
        offset,
      });

      res.set('X-Total-Count', String(count));
      res.json(rows);
    } catch (error) {
      handleError(res, error, name);
    }
  });

  app.get(`/api/${name}/:${keyField}`, async (req, res) => {
    if (adminOnly && req.user?.role !== 'root' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }
    try {
      const row = await Model.findByPk(req.params[keyField]);
      if (!row) return res.status(404).json({ error: `${name} não encontrado` });
      res.json(row);
    } catch (error) {
      handleError(res, error, name);
    }
  });

  app.post(`/api/${name}`, async (req, res) => {
    if (adminOnly && req.user?.role !== 'root' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }
    const body = req.body || {};
    const validationErrors = validateFields(body, fields, fileFields, [keyField]);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join('; ') });
    }

    const record = {};
    fields.forEach((field) => {
      if (fileFields.includes(field)) {
        record[field] = filePathFor(field, req) || body[field] || null;
        return;
      }
      if (field === 'veiculo_id' || field === 'motorista_id') {
        record[field] = body[field] || null;
        return;
      }
      if ((field.endsWith('_id') && field !== 'veiculo_id' && field !== 'motorista_id') || field === 'id' || field.includes('km')) {
        record[field] = body[field] !== undefined && body[field] !== null && body[field] !== '' ? parseInt(body[field], 10) : null;
        return;
      }
      if (field === 'ativo' || field === 'pagamento_realizado' || field === 'aivo' || field === 'tanque_cheio') {
        record[field] = body[field] !== undefined && body[field] !== null ? (body[field] === true || body[field] === 1 || body[field] === '1' || body[field] === 'true' ? 1 : 0) : null;
        return;
      }
      record[field] = body[field] || null;
    });

    try {
      const created = await Model.create(record);
      const insertedId = keyField === 'id' ? String(created.id) : (record[keyField] || String(created[keyField] || ''));
      res.status(201).json({ ok: true });

      logAudit({
        user_id: req.user?.id,
        username: req.user?.username,
        acao: 'criou',
        entidade: getEntityLabel(name),
        entidade_id: insertedId,
        descricao: `${getEntityLabel(name)} criado`,
        dados_novos: cleanData(body),
        ip: req.ip,
      }).catch(err => console.error('Audit log error:', err));
    } catch (error) {
      handleError(res, error, name);
    }
  });

  app.put(`/api/${name}/:${keyField}`, async (req, res) => {
    if (adminOnly && req.user?.role !== 'root' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }
    const body = req.body || {};
    const validationErrors = validateFields(body, fields, fileFields, [keyField]);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join('; ') });
    }
    let existing;
    try {
      existing = await Model.findByPk(req.params[keyField]);
      if (!existing) {
        return res.status(404).json({ error: `${name} não encontrado` });
      }
    } catch (error) {
      return handleError(res, error, name);
    }

    const existingData = existing.toJSON();
    const updateData = {};
    fields.forEach((field) => {
      if (fileFields.includes(field)) {
        const fp = filePathFor(field, req);
        if (fp || body[field]) {
          updateData[field] = fp || body[field];
        }
        return;
      }
      const hasBodyVal = body[field] !== undefined;
      if (field === 'veiculo_id' || field === 'motorista_id') {
        updateData[field] = hasBodyVal ? (body[field] || null) : existingData[field];
        return;
      }
      if ((field.endsWith('_id') && field !== 'veiculo_id' && field !== 'motorista_id') || field === 'id' || field.includes('km')) {
        updateData[field] = hasBodyVal ? (body[field] !== '' ? parseInt(body[field], 10) : null) : existingData[field];
        return;
      }
      if (field === 'ativo' || field === 'pagamento_realizado' || field === 'aivo' || field === 'tanque_cheio') {
        if (hasBodyVal) {
          updateData[field] = (body[field] === true || body[field] === 1 || body[field] === '1' || body[field] === 'true') ? 1 : 0;
        }
        return;
      }
      if (hasBodyVal) {
        updateData[field] = body[field];
      }
    });

    try {
      await Model.update(updateData, { where: { [keyField]: req.params[keyField] } });
      res.json({ ok: true });

      logAudit({
        user_id: req.user?.id,
        username: req.user?.username,
        acao: 'atualizou',
        entidade: getEntityLabel(name),
        entidade_id: String(req.params[keyField]),
        descricao: `${getEntityLabel(name)} atualizado`,
        dados_antigos: cleanData(existingData),
        dados_novos: cleanData(body),
        ip: req.ip,
      }).catch(err => console.error('Audit log error:', err));
    } catch (error) {
      handleError(res, error, name);
    }
  });

  app.delete(`/api/${name}/:${keyField}`, requireRole('admin', 'root'), async (req, res) => {
    let existing;
    try {
      existing = await Model.findByPk(req.params[keyField]);
      if (!existing) {
        return res.status(404).json({ error: `${name} não encontrado` });
      }
    } catch (error) {
      return handleError(res, error, name);
    }
    try {
      await Model.destroy({ where: { [keyField]: req.params[keyField] } });
      res.json({ ok: true });

      logAudit({
        user_id: req.user?.id,
        username: req.user?.username,
        acao: 'excluiu',
        entidade: getEntityLabel(name),
        entidade_id: String(req.params[keyField]),
        descricao: `${getEntityLabel(name)} excluído`,
        dados_antigos: cleanData(existing.toJSON()),
        ip: req.ip,
      }).catch(err => console.error('Audit log error:', err));
    } catch (error) {
      handleError(res, error, name);
    }
  });
}

module.exports = { createRoutesFor };
