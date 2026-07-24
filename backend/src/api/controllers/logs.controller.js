const { Op } = require('sequelize');
const { handleError } = require('../../services/errorHandler');
const { logAudit } = require('../../services/auditLog');
const models = require('../../database/models');
const { parseDateToISO } = require('../utils/helpers');

const { LogAuditoria } = models;

async function list(req, res) {
  try {
    const { user_id, username, entidade, acao, data_inicio, data_fim, limit, offset } = req.query;
    const where = {};
    if (user_id) where.user_id = user_id;
    if (username) where.username = { [Op.iLike]: `%${username}%` };
    if (entidade) where.entidade = { [Op.iLike]: `%${entidade}%` };
    if (acao) where.acao = acao;

    const isoInicio = parseDateToISO(data_inicio);
    const isoFim = parseDateToISO(data_fim);
    if (isoInicio) where.created_at = { ...where.created_at, [Op.gte]: isoInicio };
    if (isoFim) where.created_at = { ...where.created_at, [Op.lte]: isoFim + ' 23:59:59' };

    const limitVal = parseInt(limit, 10) || 50;
    const offsetVal = parseInt(offset, 10) || 0;
    const result = await LogAuditoria.findAndCountAll({ where, order: [['created_at', 'DESC']], limit: limitVal, offset: offsetVal });
    res.json({ data: result.rows, total: result.count });
  } catch (error) { handleError(res, error, 'logs'); }
}

async function get(req, res) {
  try {
    const log = await LogAuditoria.findByPk(req.params.id);
    if (!log) return res.status(404).json({ error: 'Log não encontrado' });
    const row = log.toJSON();
    if (row.dados_antigos && typeof row.dados_antigos === 'string') {
      try { row.dados_antigos = JSON.parse(row.dados_antigos); } catch { row.dados_antigos = null; }
    }
    if (row.dados_novos && typeof row.dados_novos === 'string') {
      try { row.dados_novos = JSON.parse(row.dados_novos); } catch { row.dados_novos = null; }
    }
    res.json(row);
  } catch (error) { handleError(res, error, 'logs'); }
}

module.exports = { list, get };
