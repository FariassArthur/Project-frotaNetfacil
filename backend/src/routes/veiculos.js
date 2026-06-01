const { run, all, get, parseBoolean, parseInteger } = require('../database/connection');
const { filePathFor } = require('../middleware/upload');
const { logAudit } = require('../services/auditLog');
const { handleError } = require('../services/errorHandler');
const { requireRole } = require('../middleware/auth');

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

function registerVeiculosRoutes(app) {
  app.get('/api/veiculos', async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query._page, 10) || 1);
      const limit = Math.min(500, Math.max(1, parseInt(req.query._limit, 10) || 200));
      const offset = (page - 1) * limit;

      const countResult = await all('SELECT COUNT(*) as total FROM veiculos');
      const total = countResult[0]?.total || 0;

      const rows = await all('SELECT * FROM veiculos ORDER BY placa LIMIT ? OFFSET ?', [limit, offset]);
      res.set('X-Total-Count', String(total));
      res.json(rows);
    } catch (error) {
      handleError(res, error, 'veiculos');
    }
  });

  app.get('/api/veiculos/:placa', async (req, res) => {
    try {
      const row = await get('SELECT * FROM veiculos WHERE placa = ?', [req.params.placa]);
      if (!row) return res.status(404).json({ error: 'Veículo não encontrado' });
      res.json(row);
    } catch (error) {
      handleError(res, error, 'veiculos');
    }
  });

  app.post('/api/veiculos', async (req, res) => {
    const body = req.body || {};
    const placa = val(body, 'placa', 'placa');
    const pathDocumentoPDF = filePathFor('pathDocumentoPDF', req) || val(body, 'pathDocumentoPDF', 'path_documento_pdf') || null;
    try {
      if (!placa) return res.status(400).json({ error: 'placa é obrigatória' });
      const params = [
        placa,
        val(body, 'numero', 'numero') || null,
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
        parseInteger(val(body, 'cidadeId', 'cidade_id')),
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
        `INSERT INTO veiculos
        (placa, numero, tipo, fipe_name_marca, fipe_modelo, fipe_name_ano, renavam, chassi, combustivel, ano_fab, ano_modelo, capacidade, cor, cidade, cidade_id, uf, cpfcnpj, categoria, km, nome_endereco, data_aquisicao, observacao, potencia, culture_info, medidas_pneus, codigo_postal, path_documento_pdf, data_vencimento_ipva, ativo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
      );
      res.status(201).json({ ok: true });

      logAudit({
        user_id: req.user?.id,
        username: req.user?.username,
        acao: 'criou',
        entidade: 'Veículo',
        entidade_id: placa,
        descricao: `Veículo ${placa} criado`,
        dados_novos: cleanData(body),
        ip: req.ip,
      }).catch(err => console.error('Audit log error:', err));
    } catch (error) {
      handleError(res, error, 'veiculos');
    }
  });

  app.put('/api/veiculos/:placa', async (req, res) => {
    const body = req.body || {};
    const pathDocumentoPDF = filePathFor('pathDocumentoPDF', req) || val(body, 'pathDocumentoPDF', 'path_documento_pdf') || null;
    try {
      const placa = req.params.placa;
      if (!placa) return res.status(400).json({ error: 'placa inválida' });
      const exists = await get('SELECT * FROM veiculos WHERE placa = ?', [placa]);
      if (!exists) return res.status(404).json({ error: 'Veículo não encontrado' });
      await run(
        `UPDATE veiculos SET numero = ?, tipo = ?, fipe_name_marca = ?, fipe_modelo = ?, fipe_name_ano = ?, renavam = ?, chassi = ?, combustivel = ?, ano_fab = ?, ano_modelo = ?, capacidade = ?, cor = ?, cidade = ?, cidade_id = ?, uf = ?, cpfcnpj = ?, categoria = ?, km = ?, nome_endereco = ?, data_aquisicao = ?, observacao = ?, potencia = ?, culture_info = ?, medidas_pneus = ?, codigo_postal = ?, path_documento_pdf = ?, data_vencimento_ipva = ?, ativo = ? WHERE placa = ?`,
        [
          val(body, 'numero', 'numero') || null,
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
          parseInteger(val(body, 'cidadeId', 'cidade_id')),
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

      logAudit({
        user_id: req.user?.id,
        username: req.user?.username,
        acao: 'atualizou',
        entidade: 'Veículo',
        entidade_id: placa,
        descricao: `Veículo ${placa} atualizado`,
        dados_antigos: cleanData(exists),
        dados_novos: cleanData(body),
        ip: req.ip,
      }).catch(err => console.error('Audit log error:', err));
    } catch (error) {
      handleError(res, error, 'veiculos');
    }
  });

  app.delete('/api/veiculos/:placa', requireRole('admin', 'root'), async (req, res) => {
    const placa = req.params.placa;
    try {
      const exists = await get('SELECT * FROM veiculos WHERE placa = ?', [placa]);
      if (!exists) {
        return res.status(404).json({ error: 'Veículo não encontrado' });
      }
      await run('DELETE FROM veiculos WHERE placa = ?', [placa]);
      res.json({ ok: true });

      logAudit({
        user_id: req.user?.id,
        username: req.user?.username,
        acao: 'excluiu',
        entidade: 'Veículo',
        entidade_id: placa,
        descricao: `Veículo ${placa} excluído`,
        dados_antigos: cleanData(exists),
        ip: req.ip,
      }).catch(err => console.error('Audit log error:', err));
    } catch (error) {
      handleError(res, error, 'veiculos');
    }
  });
}

module.exports = { registerVeiculosRoutes };
