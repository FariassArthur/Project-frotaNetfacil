const { openDb, run, all, get, parseBoolean, parseInteger } = require('../database/connection');
const { filePathFor } = require('../middleware/upload');
const { logAudit } = require('../services/auditLog');

const SENSITIVE_FIELDS = ['password'];

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

function createRoutesFor(app, { name, tableName, keyField, fields, fileFields = [] }) {
  app.get(`/api/${name}`, async (req, res) => {
    const db = openDb();
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
      const where = filters.length ? 'WHERE ' + filters.join(' AND ') : '';
      const rows = await all(db, `SELECT * FROM ${tableName} ${where} ORDER BY ${keyField}`, params);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });

  app.get(`/api/${name}/:${keyField}`, async (req, res) => {
    const db = openDb();
    try {
      const row = await get(db, `SELECT * FROM ${tableName} WHERE ${keyField} = ?`, [req.params[keyField]]);
      if (!row) return res.status(404).json({ error: `${name} não encontrado` });
      res.json(row);
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });

  app.post(`/api/${name}`, async (req, res) => {
    const db = openDb();
    const body = req.body || {};
    const values = fields.map((field) => {
      if (fileFields.includes(field)) {
        return filePathFor(field, req) || body[field] || null;
      }
      if (field === 'veiculo_id') return body['veiculo_id'] || body['veiculoId'] || null;
      if ((field.endsWith('_id') && field !== 'veiculo_id') || field === 'id' || field.includes('km')) return parseInteger(body[field]);
      if (field === 'ativo' || field === 'pagamento_realizado' || field === 'aivo') return parseBoolean(body[field]) ? 1 : 0;
      return body[field] || null;
    });

    try {
      const result = await run(
        db,
        `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`,
        values
      );
      const insertedId = keyField === 'id' ? String(result.lastID) : (body[keyField] || values[0]);
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
      }).catch(() => {});
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });

  app.put(`/api/${name}/:${keyField}`, async (req, res) => {
    const db = openDb();
    const body = req.body || {};
    const existing = await get(db, `SELECT * FROM ${tableName} WHERE ${keyField} = ?`, [req.params[keyField]]);
    if (!existing) {
      db.close();
      return res.status(404).json({ error: `${name} não encontrado` });
    }

    const values = fields.map((field) => {
      if (fileFields.includes(field)) {
        return filePathFor(field, req) || body[field] || existing[field] || null;
      }
      if (field === 'veiculo_id') return (body['veiculo_id'] !== undefined ? body['veiculo_id'] : (body['veiculoId'] !== undefined ? body['veiculoId'] : existing[field])) || null;
      if ((field.endsWith('_id') && field !== 'veiculo_id') || field === 'id' || field.includes('km')) return parseInteger(body[field]) ?? existing[field] ?? null;
      if (field === 'ativo' || field === 'pagamento_realizado' || field === 'aivo') {
        const boolValue = body[field] !== undefined ? parseBoolean(body[field]) : existing[field];
        return boolValue ? 1 : 0;
      }
      return body[field] !== undefined ? body[field] : existing[field];
    });

    try {
      await run(
        db,
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
      }).catch(() => {});
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });

  app.delete(`/api/${name}/:${keyField}`, async (req, res) => {
    const db = openDb();
    const existing = await get(db, `SELECT * FROM ${tableName} WHERE ${keyField} = ?`, [req.params[keyField]]);
    if (!existing) {
      db.close();
      return res.status(404).json({ error: `${name} não encontrado` });
    }
    try {
      await run(db, `DELETE FROM ${tableName} WHERE ${keyField} = ?`, [req.params[keyField]]);
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
      }).catch(() => {});
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });
}

module.exports = { createRoutesFor };
