const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { Usuario } = require('../../database/models');
const { logAudit } = require('../../services/auditLog');
const { handleError } = require('../../services/errorHandler');

const SENSITIVE_FIELDS = ['password'];

function validatePasswordStrength(password) {
  if (!password || password.length < 8) return 'A senha deve ter pelo menos 8 caracteres';
  if (!/[A-Z]/.test(password)) return 'A senha deve conter pelo menos uma letra maiúscula';
  if (!/[a-z]/.test(password)) return 'A senha deve conter pelo menos uma letra minúscula';
  if (!/[0-9]/.test(password)) return 'A senha deve conter pelo menos um número';
  return null;
}

function cleanData(data) {
  if (!data) return null;
  const cleaned = { ...data };
  SENSITIVE_FIELDS.forEach((f) => delete cleaned[f]);
  return cleaned;
}

const USER_FIELDS = ['id', 'username', 'nome_completo', 'email', 'telefone', 'role', 'ativo', 'permissoes'];

async function list(req, res) {
  try {
    const page = parseInt(req.query._page, 10) || null;
    const limit = parseInt(req.query._limit, 10) || null;
    const q = (req.query._q || '').trim();
    const where = {};
    if (q) {
      where[Op.or] = [
        { username: { [Op.like]: `%${q}%` } },
        { nome_completo: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
      ];
    }
    if (page && limit) {
      const result = await Usuario.findAndCountAll({ attributes: USER_FIELDS, where, order: [['username', 'ASC']], limit, offset: (page - 1) * limit });
      res.set('X-Total-Count', String(result.count));
      return res.json(result.rows);
    }
    const rows = await Usuario.findAll({ attributes: USER_FIELDS, where, order: [['username', 'ASC']] });
    res.json(rows);
  } catch (error) { handleError(res, error, 'usuarios'); }
}

async function get(req, res) {
  try {
    const user = await Usuario.findByPk(req.params.id, { attributes: USER_FIELDS });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
  } catch (error) { handleError(res, error, 'usuarios'); }
}

async function create(req, res) {
  const { username, password, role, ativo, permissoes, nome_completo, email, telefone } = req.body || {};
  try {
    if (!username || !password) return res.status(400).json({ error: 'username e password são obrigatórios' });
    const pwError = validatePasswordStrength(password);
    if (pwError) return res.status(400).json({ error: pwError });
    const hash = await bcrypt.hash(password, 10);
    const novo = await Usuario.create({
      username, password: hash, role: role || 'user', ativo: ativo !== false ? 1 : 0,
      permissoes: permissoes || 'all', nome_completo: nome_completo || '', email: email || '', telefone: telefone || '',
    });
    res.status(201).json({ ok: true, id: String(novo.id) });
    logAudit({
      user_id: req.user?.id, username: req.user?.username, acao: 'criou', entidade: 'Usuário',
      entidade_id: String(novo.id), descricao: `Usuário ${username} criado`, dados_novos: cleanData(req.body), ip: req.ip,
    }).catch(err => console.error('Audit log error:', err));
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ error: 'Username já existe' });
    handleError(res, error, 'usuarios');
  }
}

async function alterarSenha(req, res) {
  const { currentPassword, newPassword } = req.body || {};
  try {
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword e newPassword são obrigatórios' });
    const pwError = validatePasswordStrength(newPassword);
    if (pwError) return res.status(400).json({ error: pwError });
    const user = await Usuario.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ error: 'Senha atual incorreta' });
    const hash = await bcrypt.hash(newPassword, 10);
    await Usuario.update({ password: hash }, { where: { id: req.user.id } });
    res.json({ ok: true });
    logAudit({
      user_id: req.user.id, username: req.user.username, acao: 'alterou senha', entidade: 'Usuário',
      entidade_id: String(req.user.id), descricao: `Usuário ${req.user.username} alterou a própria senha`, ip: req.ip,
    }).catch(err => console.error('Audit log error:', err));
  } catch (error) { handleError(res, error, 'usuarios'); }
}

async function update(req, res) {
  const { username, password, role, ativo, permissoes, nome_completo, email, telefone } = req.body || {};
  try {
    const user = await Usuario.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    const data = {};
    if (username !== undefined) data.username = username;
    if (role !== undefined) data.role = role;
    if (ativo !== undefined) data.ativo = ativo ? 1 : 0;
    if (permissoes !== undefined) data.permissoes = permissoes;
    if (nome_completo !== undefined) data.nome_completo = nome_completo;
    if (email !== undefined) data.email = email;
    if (telefone !== undefined) data.telefone = telefone;
    if (password !== undefined && password !== '') {
      const pwError = validatePasswordStrength(password);
      if (pwError) return res.status(400).json({ error: pwError });
      data.password = await bcrypt.hash(password, 10);
    }
    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    await Usuario.update(data, { where: { id: req.params.id } });
    res.json({ ok: true });
    logAudit({
      user_id: req.user?.id, username: req.user?.username, acao: 'atualizou', entidade: 'Usuário',
      entidade_id: String(req.params.id), descricao: `Usuário ${user.username} atualizado`,
      dados_antigos: cleanData(user.toJSON()), dados_novos: cleanData(req.body), ip: req.ip,
    }).catch(err => console.error('Audit log error:', err));
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ error: 'Username já existe' });
    handleError(res, error, 'usuarios');
  }
}

async function remove(req, res) {
  try {
    const user = await Usuario.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (user.role === 'root') return res.status(403).json({ error: 'Não é possível excluir o usuário root' });
    await Usuario.destroy({ where: { id: req.params.id } });
    res.json({ ok: true });
    logAudit({
      user_id: req.user?.id, username: req.user?.username, acao: 'excluiu', entidade: 'Usuário',
      entidade_id: String(req.params.id), descricao: `Usuário ${user.username} excluído`,
      dados_antigos: cleanData(user.toJSON()), ip: req.ip,
    }).catch(err => console.error('Audit log error:', err));
  } catch (error) { handleError(res, error, 'usuarios'); }
}

module.exports = { list, get, create, alterarSenha, update, remove };
