const { all, get, run } = require('../database/connection');
const { handleError } = require('../services/errorHandler');

function registerLookupRoutes(app) {
  app.get('/api/health', async (req, res) => {
    res.json({
      ok: true,
      db: 'sqlite',
version: process.env.npm_package_version || '1.1.0'
    });
  });

  app.get('/api/combustiveis', async (req, res) => {
    try {
      const rows = await all('SELECT * FROM combustiveis ORDER BY id');
      res.json(rows);
    } catch (error) {
      handleError(res, error, 'lookup');
    }
  });

  app.get('/api/tipos-manutencao', async (req, res) => {
    try {
      const rows = await all('SELECT * FROM tipo_manutencao ORDER BY id');
      res.json(rows);
    } catch (error) {
      handleError(res, error, 'lookup');
    }
  });

  app.get('/api/configuracoes', async (req, res) => {
    try {
      const config = await get('SELECT * FROM configuracoes WHERE id = 1');
      res.json(config || {});
    } catch (error) {
      handleError(res, error, 'lookup');
    }
  });

  const upsertConfiguracoes = async (req, res) => {
    const { codPais, idioma, cultureInfo } = req.body || {};
    try {
      if (!codPais || !idioma || !cultureInfo) {
        return res.status(400).json({ error: 'codPais, idioma e cultureInfo são obrigatórios' });
      }
      await run(
        `INSERT INTO configuracoes (id, cod_pais, idioma, culture_info)
         VALUES (1, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET cod_pais = EXCLUDED.cod_pais, idioma = EXCLUDED.idioma, culture_info = EXCLUDED.culture_info`,
        [codPais, idioma, cultureInfo]
      );
      res.json({ ok: true });
    } catch (error) {
      handleError(res, error, 'lookup');
    }
  };

  app.post('/api/configuracoes', upsertConfiguracoes);
  app.put('/api/configuracoes', upsertConfiguracoes);

  app.get('/api/versao', async (req, res) => {
    try {
      const row = await get('SELECT * FROM versoes WHERE id = 1');
      res.json(row || { version: process.env.npm_package_version || '1.1.0' });
    } catch (error) {
      handleError(res, error, 'lookup');
    }
  });
}

module.exports = { registerLookupRoutes };
