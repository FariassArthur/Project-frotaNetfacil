const { Op } = require('sequelize');
const { logAudit } = require('../../services/auditLog');
const { handleError } = require('../../services/errorHandler');
const models = require('../../database/models');

const { LogAuditoria } = models;

async function list(req, res) {
  if (!req.user || (req.user.role !== 'root' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  try {
    const { user_id, username, entidade, acao, data_inicio, data_fim, limit, offset } = req.query;
    const where = {};
    if (user_id) where.user_id = user_id;
    if (username) where.username = { [Op.like]: `%${username}%` };
    if (entidade) where.entidade = { [Op.like]: `%${entidade}%` };
    if (acao) where.acao = acao;
    if (data_inicio) where.created_at = { ...where.created_at, [Op.gte]: data_inicio };
    if (data_fim) where.created_at = { ...where.created_at, [Op.lte]: data_fim + ' 23:59:59' };
    const limitVal = parseInt(limit, 10) || 50;
    const offsetVal = parseInt(offset, 10) || 0;
    const result = await LogAuditoria.findAndCountAll({ where, order: [['created_at', 'DESC']], limit: limitVal, offset: offsetVal });
    res.json({ data: result.rows, total: result.count });
  } catch (error) { handleError(res, error, 'logs'); }
}

async function get(req, res) {
  if (!req.user || (req.user.role !== 'root' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  try {
    const log = await LogAuditoria.findByPk(req.params.id);
    if (!log) return res.status(404).json({ error: 'Log não encontrado' });
    const row = log.toJSON();
    row.dados_antigos = row.dados_antigos ? JSON.parse(row.dados_antigos) : null;
    row.dados_novos = row.dados_novos ? JSON.parse(row.dados_novos) : null;
    res.json(row);
  } catch (error) { handleError(res, error, 'logs'); }
}

module.exports = { list, get };
