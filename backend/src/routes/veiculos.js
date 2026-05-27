const { openDb, run, all, get, parseBoolean, parseInteger } = require('../database/connection');
const { filePathFor } = require('../middleware/upload');

// Accept camelCase or snake_case from body
function val(body, camel, snake) {
  return body[camel] !== undefined ? body[camel] : body[snake];
}

function registerVeiculosRoutes(app) {
  app.get('/api/veiculos', async (req, res) => {
    const db = openDb();
    try {
      const rows = await all(db, 'SELECT * FROM veiculos ORDER BY placa');
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });

  app.get('/api/veiculos/:placa', async (req, res) => {
    const db = openDb();
    try {
      const row = await get(db, 'SELECT * FROM veiculos WHERE placa = ?', [req.params.placa]);
      if (!row) return res.status(404).json({ error: 'Veículo não encontrado' });
      res.json(row);
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });

  app.post('/api/veiculos', async (req, res) => {
    const db = openDb();
    const body = req.body || {};
    const placa = val(body, 'placa', 'placa');
    const pathDocumentoPDF = filePathFor('pathDocumentoPDF', req) || val(body, 'pathDocumentoPDF', 'path_documento_pdf') || null;
    try {
      if (!placa) return res.status(400).json({ error: 'placa é obrigatória' });
      const params = [
        placa,
        val(body, 'tipo', 'tipo') || null,
        val(body, 'fipeNameMarca', 'fipe_name_marca') || null,
        val(body, 'fipeModelo', 'fipe_modelo') || null,
        val(body, 'fipeNameAno', 'fipe_name_ano') || null,
        val(body, 'renavam', 'renavam') || null,
        val(body, 'chassi', 'chassi') || null,
        parseInteger(val(body, 'combustivel', 'combustivel')),
        val(body, 'anoFab', 'ano_fab') || null,
        val(body, 'anoModelo', 'ano_modelo') || null,
        val(body, 'capacidade', 'capacidade') || null,
        val(body, 'cor', 'cor') || null,
        val(body, 'cidade', 'cidade') || null,
        val(body, 'uf', 'uf') || null,
        val(body, 'cpfcnpj', 'cpfcnpj') || null,
        val(body, 'categoria', 'categoria') || null,
        parseInteger(val(body, 'km', 'km')),
        val(body, 'nomeEndereco', 'nome_endereco') || null,
        val(body, 'dataAquisicao', 'data_aquisicao') || null,
        val(body, 'observacao', 'observacao') || null,
        val(body, 'potencia', 'potencia') || null,
        val(body, 'cultureInfo', 'culture_info') || null,
        val(body, 'medidasPneus', 'medidas_pneus') || null,
        val(body, 'codigoPostal', 'codigo_postal') || null,
        pathDocumentoPDF,
        val(body, 'dataVencimentoIPVA', 'data_vencimento_ipva') || null,
        parseBoolean(val(body, 'ativo', 'ativo')) ? 1 : 0
      ];
      await run(
        db,
        `INSERT INTO veiculos
        (placa, tipo, fipe_name_marca, fipe_modelo, fipe_name_ano, renavam, chassi, combustivel, ano_fab, ano_modelo, capacidade, cor, cidade, uf, cpfcnpj, categoria, km, nome_endereco, data_aquisicao, observacao, potencia, culture_info, medidas_pneus, codigo_postal, path_documento_pdf, data_vencimento_ipva, ativo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
      );
      res.status(201).json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });

  app.put('/api/veiculos/:placa', async (req, res) => {
    const db = openDb();
    const body = req.body || {};
    const pathDocumentoPDF = filePathFor('pathDocumentoPDF', req) || val(body, 'pathDocumentoPDF', 'path_documento_pdf') || null;
    try {
      const placa = req.params.placa;
      if (!placa) return res.status(400).json({ error: 'placa inválida' });
      const exists = await get(db, 'SELECT placa FROM veiculos WHERE placa = ?', [placa]);
      if (!exists) return res.status(404).json({ error: 'Veículo não encontrado' });
      await run(
        db,
        `UPDATE veiculos SET tipo = ?, fipe_name_marca = ?, fipe_modelo = ?, fipe_name_ano = ?, renavam = ?, chassi = ?, combustivel = ?, ano_fab = ?, ano_modelo = ?, capacidade = ?, cor = ?, cidade = ?, uf = ?, cpfcnpj = ?, categoria = ?, km = ?, nome_endereco = ?, data_aquisicao = ?, observacao = ?, potencia = ?, culture_info = ?, medidas_pneus = ?, codigo_postal = ?, path_documento_pdf = ?, data_vencimento_ipva = ?, ativo = ? WHERE placa = ?`,
        [
          val(body, 'tipo', 'tipo') || null,
          val(body, 'fipeNameMarca', 'fipe_name_marca') || null,
          val(body, 'fipeModelo', 'fipe_modelo') || null,
          val(body, 'fipeNameAno', 'fipe_name_ano') || null,
          val(body, 'renavam', 'renavam') || null,
          val(body, 'chassi', 'chassi') || null,
          parseInteger(val(body, 'combustivel', 'combustivel')),
          val(body, 'anoFab', 'ano_fab') || null,
          val(body, 'anoModelo', 'ano_modelo') || null,
          val(body, 'capacidade', 'capacidade') || null,
          val(body, 'cor', 'cor') || null,
          val(body, 'cidade', 'cidade') || null,
          val(body, 'uf', 'uf') || null,
          val(body, 'cpfcnpj', 'cpfcnpj') || null,
          val(body, 'categoria', 'categoria') || null,
          parseInteger(val(body, 'km', 'km')),
          val(body, 'nomeEndereco', 'nome_endereco') || null,
          val(body, 'dataAquisicao', 'data_aquisicao') || null,
          val(body, 'observacao', 'observacao') || null,
          val(body, 'potencia', 'potencia') || null,
          val(body, 'cultureInfo', 'culture_info') || null,
          val(body, 'medidasPneus', 'medidas_pneus') || null,
          val(body, 'codigoPostal', 'codigo_postal') || null,
          pathDocumentoPDF,
          val(body, 'dataVencimentoIPVA', 'data_vencimento_ipva') || null,
          parseBoolean(val(body, 'ativo', 'ativo')) ? 1 : 0,
          placa
        ]
      );
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });

  app.delete('/api/veiculos/:placa', async (req, res) => {
    const db = openDb();
    try {
      await run(db, 'DELETE FROM veiculos WHERE placa = ?', [req.params.placa]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: String(error.message || error) });
    } finally {
      db.close();
    }
  });
}

module.exports = { registerVeiculosRoutes };
