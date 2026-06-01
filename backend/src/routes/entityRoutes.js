const { run, all, get, parseBoolean, parseInteger } = require('../database/connection');
const { filePathFor } = require('../middleware/upload');
const { logAudit } = require('../services/auditLog');
const { handleError } = require('../services/errorHandler');
const { requireRole } = require('../middleware/auth');

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

  app.get(`/api/${name}`, async (req, res) => {
    if (adminOnly && req.user?.role !== 'root' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }
    try {
      const filters = [];
      const params = [];
      if (req.query.veiculo_id) {
        filters.push('veiculo_id = ?');
        params.push(req.query.veiculo_id);
      }
      if (req.query.seguradora_id) {
        filters.push('seguradora_id = ?');
        params.push(req.query.seguradora_id);
      }
      if (req.query.contrato_seguro_id) {
        filters.push('contrato_seguro_id = ?');
        params.push(req.query.contrato_seguro_id);
      }
      if (req.query.motorista_id) {
        filters.push('motorista_id = ?');
        params.push(req.query.motorista_id);
      }

      if (req.query._q) {
        const searchable = fields.filter(f =>
          !fileFields.includes(f) && f !== keyField &&
          !f.endsWith('_id') && f !== 'id' && f !== 'ativo' &&
          f !== 'pagamento_realizado' && f !== 'aivo' && f !== 'tanque_cheio'
        );
        if (searchable.length > 0) {
          const clauses = searchable.map(() => `${filters.length > 0 ? '' : ''}`);
          const likeVal = `%${req.query._q}%`;
          filters.push(`(${searchable.map(f => `${f} LIKE ?`).join(' OR ')})`);
          searchable.forEach(() => params.push(likeVal));
        }
      }

      Object.keys(req.query).forEach(key => {
        const startMatch = key.match(/^(.+)_start$/);
        if (startMatch && fields.includes(startMatch[1])) {
          filters.push(`${startMatch[1]} >= ?`);
          params.push(req.query[key]);
        }
        const endMatch = key.match(/^(.+)_end$/);
        if (endMatch && fields.includes(endMatch[1])) {
          filters.push(`${endMatch[1]} <= ?`);
          params.push(req.query[key] + ' 23:59:59');
        }
      });

      const where = filters.length ? 'WHERE ' + filters.join(' AND ') : '';

      const page = Math.max(1, parseInt(req.query._page, 10) || 1);
      const limit = Math.min(500, Math.max(1, parseInt(req.query._limit, 10) || 200));
      const offset = (page - 1) * limit;

      const countResult = await all(`SELECT COUNT(*) as total FROM ${tableName} ${where}`, params);
      const total = countResult[0]?.total || 0;

      const rows = await all(`SELECT * FROM ${tableName} ${where} ORDER BY ${keyField} LIMIT ? OFFSET ?`, [...params, limit, offset]);
      res.set('X-Total-Count', String(total));
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
      const row = await get(`SELECT * FROM ${tableName} WHERE ${keyField} = ?`, [req.params[keyField]]);
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
    const values = fields.map((field) => {
      if (fileFields.includes(field)) {
        return filePathFor(field, req) || body[field] || null;
      }
      if (field === 'veiculo_id' || field === 'motorista_id') return body[field] || null;
      if ((field.endsWith('_id') && field !== 'veiculo_id' && field !== 'motorista_id') || field === 'id' || field.includes('km')) return parseInteger(body[field]);
      if (field === 'ativo' || field === 'pagamento_realizado' || field === 'aivo' || field === 'tanque_cheio') return parseBoolean(body[field]) ? 1 : 0;
      return body[field] || null;
    });

    try {
      const result = await run(
        `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`,
        values
      );
      const insertedId = keyField === 'id' ? String(result.lastID || result.rows?.[0]?.[keyField] || '') : (body[keyField] || values[0]);
      res.status(201).json({ ok: true });

      logAudit({
        user_id: req.user?.id,
        username: req.user?.username,
        acao: 'criou',
        entidade: getEntityLabel(name),
        entidade_id: String(insertedId),
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
    let existing;
    try {
      existing = await get(`SELECT * FROM ${tableName} WHERE ${keyField} = ?`, [req.params[keyField]]);
      if (!existing) {
        return res.status(404).json({ error: `${name} não encontrado` });
      }
    } catch (error) {
      return handleError(res, error, name);
    }

    const values = fields.map((field) => {
      if (fileFields.includes(field)) {
        return filePathFor(field, req) || body[field] || existing[field] || null;
      }
      if (field === 'veiculo_id' || field === 'motorista_id') {
        const val = body[field] !== undefined ? body[field] : existing[field];
        return val || null;
      }
      if ((field.endsWith('_id') && field !== 'veiculo_id' && field !== 'motorista_id') || field === 'id' || field.includes('km')) return parseInteger(body[field]) ?? existing[field] ?? null;
      if (field === 'ativo' || field === 'pagamento_realizado' || field === 'aivo' || field === 'tanque_cheio') {
        const boolValue = body[field] !== undefined ? parseBoolean(body[field]) : existing[field];
        return boolValue ? 1 : 0;
      }
      return body[field] !== undefined ? body[field] : existing[field];
    });

    try {
      await run(
        `UPDATE ${tableName} SET ${fields.map((field) => `${field} = ?`).join(', ')} WHERE ${keyField} = ?`,
        [...values, req.params[keyField]]
      );
      res.json({ ok: true });

      logAudit({
        user_id: req.user?.id,
        username: req.user?.username,
        acao: 'atualizou',
        entidade: getEntityLabel(name),
        entidade_id: String(req.params[keyField]),
        descricao: `${getEntityLabel(name)} atualizado`,
        dados_antigos: cleanData(existing),
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
      existing = await get(`SELECT * FROM ${tableName} WHERE ${keyField} = ?`, [req.params[keyField]]);
      if (!existing) {
        return res.status(404).json({ error: `${name} não encontrado` });
      }
    } catch (error) {
      return handleError(res, error, name);
    }
    try {
      await run(`DELETE FROM ${tableName} WHERE ${keyField} = ?`, [req.params[keyField]]);
      res.json({ ok: true });

      logAudit({
        user_id: req.user?.id,
        username: req.user?.username,
        acao: 'excluiu',
        entidade: getEntityLabel(name),
        entidade_id: String(req.params[keyField]),
        descricao: `${getEntityLabel(name)} excluído`,
        dados_antigos: cleanData(existing),
        ip: req.ip,
      }).catch(err => console.error('Audit log error:', err));
    } catch (error) {
      handleError(res, error, name);
    }
  });
}

module.exports = { createRoutesFor };
