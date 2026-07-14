const { sequelize } = require('../../database/sequelize');
const { handleError } = require('../../services/errorHandler');
const fs = require('fs');
const { Veiculo, Cnh, Combustivel, Cidade, Mecanica, Seguradora, TipoManutencao } = require('../../database/models');

const ALLOWED_TABLES_CSV = {
  veiculos: ['placa', 'numero', 'tipo', 'fipe_name_marca', 'fipe_modelo', 'renavam', 'chassi', 'km', 'cor', 'uf', 'cidade', 'observacao'],
  cnhs: ['numero_registro', 'nome', 'nascimento', 'categoria', 'cpf', 'validade', 'emissao', 'local'],
  manutencoes: ['data', 'valor', 'descricao', 'km', 'classificacao', 'veiculo_id'],
  multas: ['data_ocorrencia', 'data_vencimento', 'valor', 'local_ocorrencia', 'veiculo_id', 'motorista_id'],
  abastecimentos: ['data', 'quantidade', 'valor', 'km', 'veiculo_id'],
  mecanicas: ['nome', 'endereco', 'cidade', 'uf', 'telefone1', 'email'],
  cidades: ['nome', 'uf'],
};

const FIELD_SYNONYMS = {
  placa: ['placa', 'placa_veiculo', 'veiculo_placa', 'prefixo', 'codigo_veiculo', 'identificador'],
  numero: ['numero', 'num', 'nro', 'frota', 'numeracao'],
  fipe_name_marca: ['marca', 'fipe_name_marca', 'fipe_marca', 'nome_marca', 'marca_fipe', 'fabricante'],
  fipe_modelo: ['modelo', 'fipe_modelo', 'modelo_fipe', 'nome_modelo'],
  renavam: ['renavam', 'renavan'],
  chassi: ['chassi', 'chassis', 'numero_chassi', 'num_chassi'],
  km: ['km', 'quilometragem', 'odometro', 'hodometro', 'kms'],
  cor: ['cor', 'color', 'cor_veiculo'],
  uf: ['uf', 'estado', 'sigla_uf', 'uf_veiculo'],
  cidade: ['cidade', 'municipio', 'cidade_veiculo'],
  observacao: ['observacao', 'obs', 'observacoes', 'anotacao', 'notas'],
  numero_registro: ['numero_registro', 'registro', 'num_registro', 'nregistro'],
  nome: ['nome', 'motorista', 'condutor', 'nome_completo', 'nome_motorista'],
  nascimento: ['nascimento', 'data_nascimento', 'dt_nascimento', 'nasc', 'dt_nasc', 'data_nasc'],
  categoria: ['categoria', 'cat', 'categoria_cnh', 'tipo_cnh'],
  cpf: ['cpf', 'documento', 'doc', 'cpf_motorista', 'documento_motorista'],
  validade: ['validade', 'data_validade', 'dt_validade', 'vencimento', 'val', 'validade_cnh'],
  emissao: ['emissao', 'data_emissao', 'dt_emissao', 'emissao_cnh'],
  local: ['local', 'local_emissao', 'orgao_emissor', 'orgao_emissao', 'orgao'],
  data: ['data', 'dt', 'data_servico', 'data_manutencao', 'data_movimento'],
  valor: ['valor', 'custo', 'preco', 'total', 'vlr'],
  descricao: ['descricao', 'desc', 'servico', 'descricao_servico'],
  classificacao: ['classificacao', 'tipo_manutencao', 'classificacao_manutencao'],
  data_ocorrencia: ['data_ocorrencia', 'data_infracao', 'dt_ocorrencia', 'data_multa'],
  data_vencimento: ['data_vencimento', 'dt_vencimento', 'data_pagamento'],
  local_ocorrencia: ['local_ocorrencia', 'local_infracao', 'endereco_multa'],
  motorista_id: ['motorista_id', 'id_motorista', 'cpf_motorista', 'condutor_id', 'motorista_cpf'],
  quantidade: ['quantidade', 'qtd', 'litros', 'volume', 'qtde'],
  endereco: ['endereco', 'logradouro', 'rua', 'end', 'endereco_completo'],
  telefone1: ['telefone1', 'telefone', 'tel', 'fone', 'contato', 'telefone_contato'],
  email: ['email', 'e-mail', 'mail', 'correio', 'email_contato'],
  veiculo_id: ['veiculo_id', 'placa_veiculo', 'veiculo_placa', 'placa', 'codigo_veiculo', 'identificador_veiculo'],
};

function normalizeFieldName(name) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s\-]+/g, '_').replace(/[^a-z0-9_]/g, '').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function buildSynonymIndex(allowedFields) {
  const idx = {};
  for (const field of allowedFields) {
    const norm = normalizeFieldName(field);
    if (!idx[norm]) idx[norm] = field;
    const synonyms = FIELD_SYNONYMS[field] || [];
    for (const syn of synonyms) { const snorm = normalizeFieldName(syn); if (!idx[snorm]) idx[snorm] = field; }
  }
  return idx;
}

function resolveFieldMapping(csvHeaders, allowedFields) {
  const synonymIndex = buildSynonymIndex(allowedFields);
  const mapping = {}; const used = new Set();
  for (const header of csvHeaders) {
    const norm = normalizeFieldName(header);
    const matched = synonymIndex[norm];
    if (matched && !used.has(matched)) { mapping[header] = matched; used.add(matched); }
    else { mapping[header] = null; }
  }
  const mappedFields = Object.values(mapping).filter(Boolean);
  const ignoredFields = Object.keys(mapping).filter(h => !mapping[h]);
  const missingFields = allowedFields.filter(f => !mappedFields.includes(f));
  return { mapping, mappedFields, ignoredFields, missingFields };
}

function parseCSV(text) {
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xFEFF) cleanText = cleanText.slice(1);
  const rows = [];
  let current = '';
  let inQuotes = false;
  let lineNum = 1;
  let fields = [];

  const pushField = () => {
    fields.push({ value: current, lineNum });
    current = '';
  };

  const pushRow = () => {
    rows.push({ fields: fields.map((f) => f.value), lineNum });
    fields = [];
  };

  for (let i = 0; i < cleanText.length; i++) {
    const ch = cleanText[i];
    if (ch === '"') {
      if (inQuotes && cleanText[i + 1] === '"') {
        current += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === ',' && !inQuotes) {
      pushField();
      continue;
    }

    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      pushField();
      pushRow();
      lineNum += 1;
      if (ch === '\r' && cleanText[i + 1] === '\n') i += 1;
      continue;
    }

    current += ch;
  }

  if (current.length > 0 || fields.length > 0) {
    pushField();
    pushRow();
  }

  return rows;
}

function csvRowsToObjects(rows) {
  if (rows.length < 2) return [];
  const headers = rows[0].fields;
  return rows.slice(1).map((row) => {
    const obj = { __lineNum: row.lineNum };
    if (row.fields.length !== headers.length) {
      obj.__badRow = true;
      return obj;
    }
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row.fields[j] || null;
    }
    return obj;
  });
}

function mapCsvRow(row, mapping) {
  const mapped = {};
  for (const [header, field] of Object.entries(mapping)) {
    if (!field) continue;
    mapped[field] = row[header] != null ? row[header] : null;
  }
  return mapped;
}

function createModelCSV(tabela) {
  const examples = {
    veiculos: ['ABC1D23,101,Caminhão,Volkswagen,Constellation 19.320,123456789,9BWCXxx,120000,Branco,SP,São Paulo,Caminhão basculante', 'XYZ9X45,202,Vuc,Mercedes-Benz,Accelo 815,987654321,9BMCXyy,85000,Prata,MG,Belo Horizonte,Entregas urbanas'],
    cnhs: ['SP123456789,João Silva,15/03/1990,E,123.456.789-00,15/03/2030,15/03/2020,DETRAN-SP', 'MG987654321,Maria Souza,20/07/1985,D,987.654.321-00,20/07/2028,20/07/2018,DETRAN-MG'],
    manutencoes: ['15/01/2025,2500.00,Troca de óleo e filtros,120000,preventiva,ABC1D23', '20/02/2025,850.00,Alinhamento e balanceamento,122000,corretiva,ABC1D23'],
    multas: ['10/01/2025,25/02/2025,350.00,Rodovia BR-101 km 210,ABC1D23,123456789', '05/03/2025,20/04/2025,195.00,Av. Paulista 1000,XYZ9X45,987654321'],
    abastecimentos: ['15/01/2025,200,1200.00,120000,ABC1D23', '20/01/2025,180,1080.00,121500,ABC1D23'],
    mecanicas: ['Oficina do João,Rua das Ofícinas 100,São Paulo,SP,(11) 99999-0001,joao@oficina.com', 'Auto Mecânica LTDA,Av. dos Autos 500,Belo Horizonte,MG,(31) 98888-0002,contato@automecanica.com'],
    cidades: ['São Paulo,SP', 'Belo Horizonte,MG'],
  };
  const allowedFields = ALLOWED_TABLES_CSV[tabela];
  const headerLine = allowedFields.join(',');
  const exampleLines = examples[tabela] || [];
  const dataLines = exampleLines.length ? exampleLines : [allowedFields.map(() => '').join(',')];
  return [headerLine, ...dataLines].join('\n');
}

async function downloadModelo(req, res) {
  const { tabela } = req.params;
  if (!ALLOWED_TABLES_CSV[tabela]) return res.status(400).json({ error: 'Tabela inválida' });
  const csv = '\uFEFF' + createModelCSV(tabela);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="modelo_${tabela}.csv"`);
  res.send(csv);
}

async function previewImport(req, res) {
  try {
    const { tabela } = req.body;
    if (!tabela || !ALLOWED_TABLES_CSV[tabela]) return res.status(400).json({ error: 'Tabela inválida. Tabelas permitidas: ' + Object.keys(ALLOWED_TABLES_CSV).join(', ') });
    if (!req.file) return res.status(400).json({ error: 'Arquivo CSV obrigatório' });
    let content;
    try { content = fs.readFileSync(req.file.path, 'utf-8'); } finally { try { fs.unlinkSync(req.file.path); } catch (_) {} }
    const parsed = parseCSV(content);
    if (parsed.length < 2) return res.status(400).json({ error: 'CSV vazio ou formato inválido. O CSV precisa ter cabeçalho + pelo menos 1 linha de dados.' });
    const headers = parsed[0].fields;
    const allowedFields = ALLOWED_TABLES_CSV[tabela];
    const { mapping, mappedFields, ignoredFields, missingFields } = resolveFieldMapping(headers, allowedFields);
    const dataRows = csvRowsToObjects(parsed);
    const sample = dataRows.slice(0, 5).map((row) => {
      const mappedRow = {};
      for (const [orig, mapped] of Object.entries(mapping)) {
        if (mapped) mappedRow[mapped] = row[orig] != null ? row[orig] : null;
      }
      return mappedRow;
    });
    // Checar referências ausentes para campos mapeados
    const referencias_faltantes = {};
    try {
      if (mappedFields.includes('veiculo_id')) {
        const valores = Array.from(new Set(dataRows.map((r) => mapCsvRow(r, mapping).veiculo_id).filter(Boolean)));
        if (valores.length > 0) {
          const encontrados = await Veiculo.findAll({ where: { placa: valores }, attributes: ['placa'] });
          const encontradosSet = new Set(encontrados.map((v) => v.placa));
          const faltantes = valores.filter((v) => !encontradosSet.has(v));
          referencias_faltantes.veiculo_id = { total_unicos: valores.length, faltantes_count: faltantes.length, faltantes_sample: faltantes.slice(0, 20) };
        }
      }
      if (mappedFields.includes('motorista_id')) {
        const valores = Array.from(new Set(dataRows.map((r) => mapCsvRow(r, mapping).motorista_id).filter(Boolean)));
        if (valores.length > 0) {
          const encontrados = await Cnh.findAll({ where: { numero_registro: valores }, attributes: ['numero_registro'] });
          const encontradosSet = new Set(encontrados.map((c) => c.numero_registro));
          const faltantes = valores.filter((v) => !encontradosSet.has(v));
          referencias_faltantes.motorista_id = { total_unicos: valores.length, faltantes_count: faltantes.length, faltantes_sample: faltantes.slice(0, 20) };
        }
      }
      if (mappedFields.includes('combustivel')) {
        const valores = Array.from(new Set(dataRows.map((r) => mapCsvRow(r, mapping).combustivel).filter(Boolean)));
        if (valores.length > 0) {
          const encontrados = [];
          for (const v of valores) {
            if (/^\d+$/.test(String(v))) {
              const e = await Combustivel.findByPk(Number(v)); if (e) encontrados.push(String(v));
            } else {
              const e = await Combustivel.findOne({ where: { tipo: String(v) } }); if (e) encontrados.push(String(v));
            }
          }
          const encontradosSet = new Set(encontrados);
          const faltantes = valores.filter((v) => !encontradosSet.has(String(v)));
          referencias_faltantes.combustivel = { total_unicos: valores.length, faltantes_count: faltantes.length, faltantes_sample: faltantes.slice(0, 20) };
        }
      }
      if (mappedFields.includes('cidade') || mappedFields.includes('cidade_id')) {
        const valores = Array.from(new Set(dataRows.map((r) => {
          const m = mapCsvRow(r, mapping);
          return m.cidade_id || m.cidade;
        }).filter(Boolean)));
        if (valores.length > 0) {
          const encontrados = [];
          for (const v of valores) {
            if (/^\d+$/.test(String(v))) {
              const e = await Cidade.findByPk(Number(v)); if (e) encontrados.push(String(v));
            } else {
              const e = await Cidade.findOne({ where: { nome: String(v) } }); if (e) encontrados.push(String(v));
            }
          }
          const encontradosSet = new Set(encontrados);
          const faltantes = valores.filter((v) => !encontradosSet.has(String(v)));
          referencias_faltantes.cidade = { total_unicos: valores.length, faltantes_count: faltantes.length, faltantes_sample: faltantes.slice(0, 20) };
        }
      }
      if (mappedFields.includes('mecanica_id')) {
        const valores = Array.from(new Set(dataRows.map((r) => mapCsvRow(r, mapping).mecanica_id).filter(Boolean)));
        if (valores.length > 0) {
          const encontrados = [];
          for (const v of valores) {
            if (/^\d+$/.test(String(v))) {
              const e = await Mecanica.findByPk(Number(v)); if (e) encontrados.push(String(v));
            } else {
              const e = await Mecanica.findOne({ where: { nome: String(v) } }); if (e) encontrados.push(String(v));
            }
          }
          const encontradosSet = new Set(encontrados);
          const faltantes = valores.filter((v) => !encontradosSet.has(String(v)));
          referencias_faltantes.mecanica_id = { total_unicos: valores.length, faltantes_count: faltantes.length, faltantes_sample: faltantes.slice(0, 20) };
        }
      }
      if (mappedFields.includes('seguradora_id')) {
        const valores = Array.from(new Set(dataRows.map((r) => mapCsvRow(r, mapping).seguradora_id).filter(Boolean)));
        if (valores.length > 0) {
          const encontrados = [];
          for (const v of valores) {
            if (/^\d+$/.test(String(v))) {
              const e = await Seguradora.findByPk(Number(v)); if (e) encontrados.push(String(v));
            } else {
              const e = await Seguradora.findOne({ where: { nome: String(v) } }); if (e) encontrados.push(String(v));
            }
          }
          const encontradosSet = new Set(encontrados);
          const faltantes = valores.filter((v) => !encontradosSet.has(String(v)));
          referencias_faltantes.seguradora_id = { total_unicos: valores.length, faltantes_count: faltantes.length, faltantes_sample: faltantes.slice(0, 20) };
        }
      }
      if (mappedFields.includes('tipo_manutencao_id')) {
        const valores = Array.from(new Set(dataRows.map((r) => mapCsvRow(r, mapping).tipo_manutencao_id).filter(Boolean)));
        if (valores.length > 0) {
          const encontrados = [];
          for (const v of valores) {
            if (/^\d+$/.test(String(v))) {
              const e = await TipoManutencao.findByPk(Number(v)); if (e) encontrados.push(String(v));
            } else {
              const e = await TipoManutencao.findOne({ where: { descricao: String(v) } }); if (e) encontrados.push(String(v));
            }
          }
          const encontradosSet = new Set(encontrados);
          const faltantes = valores.filter((v) => !encontradosSet.has(String(v)));
          referencias_faltantes.tipo_manutencao_id = { total_unicos: valores.length, faltantes_count: faltantes.length, faltantes_sample: faltantes.slice(0, 20) };
        }
      }
    } catch (e) {
      // ignore preview reference check errors
    }

    const response = { ok: true, tabela, total_linhas: dataRows.length, mapeamento: mapping, campos_mapeados: mappedFields, campos_ignorados: ignoredFields, campos_nao_encontrados: missingFields, amostra: sample };
    if (Object.keys(referencias_faltantes).length > 0) response.referencias_faltantes = referencias_faltantes;
    res.json(response);
}

async function doImport(req, res) {
  try {
    const { tabela } = req.body;
    if (!tabela || !ALLOWED_TABLES_CSV[tabela]) return res.status(400).json({ error: 'Tabela inválida. Tabelas permitidas: ' + Object.keys(ALLOWED_TABLES_CSV).join(', ') });
    if (!req.file) return res.status(400).json({ error: 'Arquivo CSV obrigatório' });
    let content;
    try { content = fs.readFileSync(req.file.path, 'utf-8'); } finally { try { fs.unlinkSync(req.file.path); } catch (_) {} }
    const parsed = parseCSV(content);
    if (parsed.length < 2) return res.status(400).json({ error: 'CSV vazio ou formato inválido' });
    const headers = parsed[0].fields;
    const allowedFields = ALLOWED_TABLES_CSV[tabela];
    const { mapping, mappedFields, ignoredFields, missingFields } = resolveFieldMapping(headers, allowedFields);
    if (mappedFields.length === 0) return res.status(400).json({ error: 'Nenhum campo reconhecido. Verifique os cabeçalhos do CSV.', campos_esperados: allowedFields });
    const dataRows = csvRowsToObjects(parsed);
    let importados = 0;
    let erros = 0;
    const detalhesErros = [];
    for (let index = 0; index < dataRows.length; index += 1) {
      const row = dataRows[index];
      const linha = row.__lineNum || index + 2;
      if (row.__badRow) {
        erros += 1;
        detalhesErros.push({ linha, motivo: 'Linha com número incorreto de colunas' });
        if (detalhesErros.length > 100) {
          detalhesErros.push({ linha: '...', motivo: `Mais erros não listados (total: ${erros})` });
          break;
        }
        continue;
      }
      const mappedRow = mapCsvRow(row, mapping);

      // Auto-cria registros referenciados mínimos quando possível
      try {
        if (mappedFields.includes('veiculo_id') && mappedRow.veiculo_id) {
          const v = mappedRow.veiculo_id;
          const exists = await Veiculo.findByPk(v);
          if (!exists) await Veiculo.create({ placa: v, ativo: 1 });
        }
        if (mappedFields.includes('motorista_id') && mappedRow.motorista_id) {
          const m = mappedRow.motorista_id;
          const exists = await Cnh.findByPk(m);
          if (!exists) await Cnh.create({ numero_registro: m, nome: null });
        }
        if (mappedFields.includes('combustivel') && mappedRow.combustivel) {
          const v = mappedRow.combustivel;
          if (/^\d+$/.test(String(v))) {
            const exists = await Combustivel.findByPk(Number(v)); if (!exists) await Combustivel.create({ tipo: String(v) });
          } else {
            const exists = await Combustivel.findOne({ where: { tipo: String(v) } }); if (!exists) await Combustivel.create({ tipo: String(v) });
          }
        }
        if ((mappedFields.includes('cidade_id') && mappedRow.cidade_id) || (mappedFields.includes('cidade') && mappedRow.cidade && tabela === 'veiculos')) {
          const val = mappedRow.cidade_id || mappedRow.cidade;
          if (/^\d+$/.test(String(val))) {
            const exists = await Cidade.findByPk(Number(val)); if (!exists) await Cidade.create({ nome: String(val), uf: mappedRow.uf || null });
          } else {
            const exists = await Cidade.findOne({ where: { nome: String(val) } }); if (!exists) await Cidade.create({ nome: String(val), uf: mappedRow.uf || null });
          }
        }
        if (mappedFields.includes('mecanica_id') && mappedRow.mecanica_id) {
          const val = mappedRow.mecanica_id;
          if (/^\d+$/.test(String(val))) {
            const exists = await Mecanica.findByPk(Number(val)); if (!exists) await Mecanica.create({ nome: String(val) });
          } else {
            const exists = await Mecanica.findOne({ where: { nome: String(val) } }); if (!exists) await Mecanica.create({ nome: String(val) });
          }
        }
        if (mappedFields.includes('seguradora_id') && mappedRow.seguradora_id) {
          const val = mappedRow.seguradora_id;
          if (/^\d+$/.test(String(val))) {
            const exists = await Seguradora.findByPk(Number(val)); if (!exists) await Seguradora.create({ nome: String(val) });
          } else {
            const exists = await Seguradora.findOne({ where: { nome: String(val) } }); if (!exists) await Seguradora.create({ nome: String(val) });
          }
        }
        if (mappedFields.includes('tipo_manutencao_id') && mappedRow.tipo_manutencao_id) {
          const val = mappedRow.tipo_manutencao_id;
          if (/^\d+$/.test(String(val))) {
            const exists = await TipoManutencao.findByPk(Number(val)); if (!exists) await TipoManutencao.create({ descricao: String(val) });
          } else {
            const exists = await TipoManutencao.findOne({ where: { descricao: String(val) } }); if (!exists) await TipoManutencao.create({ descricao: String(val) });
          }
        }
      } catch (e) {
        // ignore individual creation errors
      }

      const vals = mappedFields.map((f) => mappedRow[f] != null ? mappedRow[f] : null);
      const cols = mappedFields.map((f) => `"${f}"`).join(', ');
      const placeholders = mappedFields.map(() => '?').join(', ');
      try {
        await sequelize.query(`INSERT INTO ${tabela} (${cols}) VALUES (${placeholders})`, { replacements: vals });
        importados += 1;
      } catch (err) {
        erros += 1;
        detalhesErros.push({ linha, motivo: err.message });
        if (detalhesErros.length > 100) {
          detalhesErros.push({ linha: '...', motivo: `Mais erros não listados (total: ${erros})` });
          break;
        }
      }
    }
    res.json({ ok: true, tabela, total: dataRows.length, importados, erros, campos_mapeados: mappedFields, campos_ignorados: ignoredFields, ...(detalhesErros.length > 0 && { detalhes_erros: detalhesErros }) });
  } catch (error) { handleError(res, error, 'importar.csv'); }
}

module.exports = { downloadModelo, previewImport, doImport };
