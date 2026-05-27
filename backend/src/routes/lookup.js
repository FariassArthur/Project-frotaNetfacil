const path = require('path');
const { DB_PATH } = require('../config');
const { openDb, all, get, run } = require('../database/connection');

function registerLookupRoutes(app) {
  app.get('/api/health', async (req, res) => {
    res.json({
      ok: true,
      db: path.basename(DB_PATH),
      uploadsBase: path.relative(process.cwd(), DB_PATH),
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  app.get('/api/combustiveis', async (req, res) => {
    const db = openDb();
    try {
      const rows = await all(db, 'SELECT * FROM combustiveis ORDER BY id');
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });

  app.get('/api/tipos-manutencao', async (req, res) => {
    const db = openDb();
    try {
      const rows = await all(db, 'SELECT * FROM tipo_manutencao ORDER BY id');
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });

  app.get('/api/configuracoes', async (req, res) => {
    const db = openDb();
    try {
      const config = await get(db, 'SELECT * FROM configuracoes WHERE id = 1');
      res.json(config || {});
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });

  const upsertConfiguracoes = async (req, res) => {
    const db = openDb();
    const { codPais, idioma, cultureInfo } = req.body || {};
    try {
      if (!codPais || !idioma || !cultureInfo) {
        return res.status(400).json({ error: 'codPais, idioma e cultureInfo são obrigatórios' });
      }
      await run(
        db,
        `INSERT INTO configuracoes (id, cod_pais, idioma, culture_info)
         VALUES (1, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET cod_pais = excluded.cod_pais, idioma = excluded.idioma, culture_info = excluded.culture_info`,
        [codPais, idioma, cultureInfo]
      );
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  };

  app.post('/api/configuracoes', upsertConfiguracoes);
  app.put('/api/configuracoes', upsertConfiguracoes);

  app.get('/api/versao', async (req, res) => {
    const db = openDb();
    try {
      const row = await get(db, 'SELECT * FROM versoes WHERE id = 1');
      res.json(row || { version: process.env.npm_package_version || '1.0.0' });
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });
}

module.exports = { registerLookupRoutes };
