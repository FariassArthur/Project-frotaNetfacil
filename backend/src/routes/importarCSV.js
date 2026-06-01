const { run, all, get } = require('../database/connection');
const { handleError } = require('../services/errorHandler');
const { requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const upload = multer({ dest: path.join(__dirname, '../../temp_import') });

const ALLOWED_TABLES_CSV = {
  veiculos: ['placa', 'numero', 'tipo', 'fipe_name_marca', 'fipe_modelo', 'renavam', 'chassi', 'km', 'cor', 'uf', 'cidade', 'observacao'],
  cnhs: ['numero_registro', 'nome', 'nascimento', 'categoria', 'cpf', 'validade', 'emissao', 'local'],
  manutencoes: ['data', 'valor', 'descricao', 'km', 'classificacao', 'veiculo_id'],
  multas: ['data_ocorrencia', 'data_vencimento', 'valor', 'local_ocorrencia', 'veiculo_id', 'motorista_id'],
  abastecimentos: ['data', 'quantidade', 'valor', 'km', 'veiculo_id'],
  mecanicas: ['nome', 'endereco', 'cidade', 'uf', 'telefone1', 'email'],
  cidades: ['nome', 'uf'],
};

function parseCSV(text) {
  const lines = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { lines.push(current.trim()); current = ''; continue; }
    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (current.trim()) lines.push(current.trim());
      current = '';
      if (ch === '\r' && text[i + 1] === '\n') i++;
      continue;
    }
    current += ch;
  }
  if (current.trim()) lines.push(current.trim());

  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',').map(v => v.trim());
    if (vals.length !== headers.length) continue;
    const obj = {};
    for (let j = 0; j < headers.length; j++) obj[headers[j]] = vals[j] || null;
    result.push(obj);
  }
  return result;
}

function registerImportarCSVRoutes(app) {
  app.post('/api/importar/csv', requireRole('admin', 'root'), upload.single('file'), async (req, res) => {
    try {
      const { tabela } = req.body;
      if (!tabela || !ALLOWED_TABLES_CSV[tabela]) {
        return res.status(400).json({ error: 'Tabela inválida. Tabelas permitidas: ' + Object.keys(ALLOWED_TABLES_CSV).join(', ') });
      }

      if (!req.file) return res.status(400).json({ error: 'Arquivo CSV obrigatório' });

      const content = fs.readFileSync(req.file.path, 'utf-8');
      const rows = parseCSV(content);

      // Clean temp file
      try { fs.unlinkSync(req.file.path); } catch (_) {}

      if (rows.length === 0) {
        return res.status(400).json({ error: 'CSV vazio ou formato inválido' });
      }

      const allowedFields = ALLOWED_TABLES_CSV[tabela];
      const firstRowFields = Object.keys(rows[0]);
      const validFields = firstRowFields.filter(f => allowedFields.includes(f));

      if (validFields.length === 0) {
        return res.status(400).json({ error: `Nenhum campo válido. Campos permitidos: ${allowedFields.join(', ')}` });
      }

      let importados = 0;
      let erros = 0;

      for (const row of rows) {
        try {
          const cols = validFields.map(f => `"${f}"`).join(', ');
          const placeholders = validFields.map(() => '?').join(', ');
          const vals = validFields.map(f => row[f] !== undefined ? row[f] : null);
          await run(`INSERT INTO ${tabela} (${cols}) VALUES (${placeholders})`, vals);
          importados++;
        } catch (err) {
          erros++;
        }
      }

      res.json({
        ok: true,
        tabela,
        total: rows.length,
        importados,
        erros,
        campos_mapeados: validFields,
      });
    } catch (error) {
      handleError(res, error, 'importar.csv');
    }
  });
}

module.exports = { registerImportarCSVRoutes };
