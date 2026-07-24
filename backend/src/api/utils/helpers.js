const { Op } = require('sequelize');
const { ENTITY_LABELS, SENSITIVE_FIELDS } = require('./constants');

function cleanData(data) {
  if (!data || typeof data !== 'object') return {};
  const cleaned = { ...data };
  delete cleaned.id;
  delete cleaned.created_at;
  delete cleaned.updated_at;
  return cleaned;
}

function sanitizeSensitiveFields(data) {
  if (!data || typeof data !== 'object') return data;
  const sanitized = { ...data };
  for (const field of SENSITIVE_FIELDS) {
    if (sanitized[field]) {
      sanitized[field] = '********';
    }
  }
  return sanitized;
}

function buildDateFilter(columnName, dataInicio, dataFim) {
  const conditions = [];
  if (dataInicio) {
    conditions.push({ [Op.gte]: dataInicio });
  }
  if (dataFim) {
    conditions.push({ [Op.lte]: dataFim });
  }
  if (conditions.length === 0) return null;
  if (conditions.length === 1) {
    return { [columnName]: conditions[0] };
  }
  return { [columnName]: { [Op.and]: conditions } };
}

function buildSearchFilter(fields, searchTerm) {
  if (!searchTerm || !searchTerm.trim()) return null;
  const term = searchTerm.trim().replace(/[%_]/g, (m) => `\\${m}`);
  return {
    [Op.or]: fields.map((field) => ({
      [field]: { [Op.iLike]: `%${term}%` },
    })),
  };
}

function calculateKmPerLiter(km, litros) {
  if (!km || !litros || litros <= 0) return 0;
  return Math.round((km / litros) * 100) / 100;
}

function calculateCostPerKm(custo, km) {
  if (!km || km <= 0 || !custo) return 0;
  return Math.round((custo / km) * 100) / 100;
}

function parseBool(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    return value === 'true' || value === '1' || value === 'sim';
  }
  return false;
}

function parseInteger(value) {
  if (typeof value === 'number') return Math.floor(value);
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

function parseFloat(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(',', '.'));
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

function getEntityLabel(tableName) {
  return ENTITY_LABELS[tableName] || tableName;
}

function escapeLike(value) {
  if (!value) return '';
  return value.replace(/[%_\\]/g, (m) => `\\${m}`);
}

function formatDateBR(dateStr) {
  if (!dateStr) return '';
  if (dateStr.length === 10 && dateStr.includes('-')) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }
  return dateStr;
}

function parseDateToISO(dateStr) {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  return null;
}

module.exports = {
  cleanData,
  sanitizeSensitiveFields,
  buildDateFilter,
  buildSearchFilter,
  calculateKmPerLiter,
  calculateCostPerKm,
  parseBool,
  parseInteger,
  parseFloat,
  getEntityLabel,
  escapeLike,
  formatDateBR,
  parseDateToISO,
};
