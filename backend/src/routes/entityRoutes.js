const { openDb, run, all, get, parseBoolean, parseInteger } = require('../database/connection');
const { filePathFor } = require('../middleware/upload');

function createRoutesFor(app, { name, tableName, keyField, fields, fileFields = [] }) {
  app.get(`/api/${name}`, async (req, res) => {
    const db = openDb();
    try {
      const rows = await all(db, `SELECT * FROM ${tableName} ORDER BY ${keyField}`);
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
      await run(
        db,
        `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`,
        values
      );
      res.status(201).json({ ok: true });
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
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });

  app.delete(`/api/${name}/:${keyField}`, async (req, res) => {
    const db = openDb();
    try {
      await run(db, `DELETE FROM ${tableName} WHERE ${keyField} = ?`, [req.params[keyField]]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });
}

module.exports = { createRoutesFor };
