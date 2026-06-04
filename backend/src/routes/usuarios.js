const bcrypt = require('bcryptjs');
const { run, get, all } = require('../database/connection');
const { logAudit } = require('../services/auditLog');
const { handleError } = require('../services/errorHandler');
const { requireRole } = require('../middleware/auth');

const SENSITIVE_FIELDS = ['password'];

function validatePasswordStrength(password) {
  if (!password || password.length < 8) {
    return 'A senha deve ter pelo menos 8 caracteres';
  }
  if (!/[A-Z]/.test(password)) {
    return 'A senha deve conter pelo menos uma letra maiúscula';
  }
  if (!/[a-z]/.test(password)) {
    return 'A senha deve conter pelo menos uma letra minúscula';
  }
  if (!/[0-9]/.test(password)) {
    return 'A senha deve conter pelo menos um número';
  }
  return null;
}

function cleanData(data) {
  if (!data) return null;
  const cleaned = { ...data };
  SENSITIVE_FIELDS.forEach((f) => delete cleaned[f]);
  return cleaned;
}

const USER_FIELDS = 'id, username, nome_completo, email, telefone, role, ativo, permissoes';

function registerUsuariosRoutes(app) {
  app.get('/api/usuarios', requireRole('admin', 'root'), async (req, res) => {
    try {
      const page = parseInt(req.query._page, 10) || null;
      const limit = parseInt(req.query._limit, 10) || null;
      const q = (req.query._q || '').trim();

      const conditions = [];
      const params = [];

      if (q) {
        conditions.push('(username LIKE ? OR nome_completo LIKE ? OR email LIKE ?)');
        const like = `%${q}%`;
        params.push(like, like, like);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      if (page && limit) {
        const countRow = await all(`SELECT COUNT(*) as cnt FROM usuarios ${where}`, params);
        const total = countRow[0]?.cnt || 0;
        const offset = (page - 1) * limit;
        const rows = await all(
          `SELECT ${USER_FIELDS} FROM usuarios ${where} ORDER BY username LIMIT ? OFFSET ?`,
          [...params, limit, offset]
        );
        res.set('X-Total-Count', String(total));
        return res.json(rows);
      }

      const rows = await all(`SELECT ${USER_FIELDS} FROM usuarios ORDER BY username`);
      res.json(rows);
    } catch (error) {
      handleError(res, error, 'usuarios');
    }
  });

  app.get('/api/usuarios/:id', requireRole('admin', 'root'), async (req, res) => {
    try {
      const row = await get(`SELECT ${USER_FIELDS} FROM usuarios WHERE id = ?`, [req.params.id]);
      if (!row) return res.status(404).json({ error: 'Usuário não encontrado' });
      res.json(row);
    } catch (error) {
      handleError(res, error, 'usuarios');
    }
  });

  app.post('/api/usuarios', requireRole('admin', 'root'), async (req, res) => {
    const { username, password, role, ativo, permissoes, nome_completo, email, telefone } = req.body || {};
    try {
      if (!username || !password) return res.status(400).json({ error: 'username e password são obrigatórios' });
      const pwError = validatePasswordStrength(password);
      if (pwError) return res.status(400).json({ error: pwError });
      const hash = await bcrypt.hash(password, 10);
      const result = await run(
        'INSERT INTO usuarios (username, password, role, ativo, permissoes, nome_completo, email, telefone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [username, hash, role || 'user', ativo !== false ? 1 : 0, permissoes || 'all', nome_completo || '', email || '', telefone || '']
      );
      const userId = String(result.lastID || result.rows?.[0]?.id || '');
      res.status(201).json({ ok: true, id: userId });

      logAudit({
        user_id: req.user?.id,
        username: req.user?.username,
        acao: 'criou',
        entidade: 'Usuário',
        entidade_id: userId,
        descricao: `Usuário ${username} criado`,
        dados_novos: cleanData(req.body),
        ip: req.ip,
      }).catch(err => console.error('Audit log error:', err));
    } catch (error) {
      if (error.message && error.message.includes('unique')) {
        return res.status(409).json({ error: 'Username já existe' });
      }
      handleError(res, error, 'usuarios');
    }
  });

  app.put('/api/usuarios/alterar-senha', async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    try {
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'currentPassword e newPassword são obrigatórios' });
      }
      const pwError = validatePasswordStrength(newPassword);
      if (pwError) return res.status(400).json({ error: pwError });
      const user = await get('SELECT * FROM usuarios WHERE id = ?', [req.user.id]);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) return res.status(401).json({ error: 'Senha atual incorreta' });

      const hash = await bcrypt.hash(newPassword, 10);
      await run('UPDATE usuarios SET password = ? WHERE id = ?', [hash, req.user.id]);
      res.json({ ok: true });

      logAudit({
        user_id: req.user.id,
        username: req.user.username,
        acao: 'alterou senha',
        entidade: 'Usuário',
        entidade_id: String(req.user.id),
        descricao: `Usuário ${req.user.username} alterou a própria senha`,
        ip: req.ip,
      }).catch(err => console.error('Audit log error:', err));
    } catch (error) {
      handleError(res, error, 'usuarios');
    }
  });

  app.put('/api/usuarios/:id', requireRole('admin', 'root'), async (req, res) => {
    const { username, password, role, ativo, permissoes, nome_completo, email, telefone } = req.body || {};
    try {
      const exists = await get('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
      if (!exists) return res.status(404).json({ error: 'Usuário não encontrado' });

      const updates = [];
      const params = [];

      if (username !== undefined) { updates.push('username = ?'); params.push(username); }
      if (role !== undefined) { updates.push('role = ?'); params.push(role); }
      if (ativo !== undefined) { updates.push('ativo = ?'); params.push(ativo ? 1 : 0); }
      if (permissoes !== undefined) { updates.push('permissoes = ?'); params.push(permissoes); }
      if (nome_completo !== undefined) { updates.push('nome_completo = ?'); params.push(nome_completo); }
      if (email !== undefined) { updates.push('email = ?'); params.push(email); }
      if (telefone !== undefined) { updates.push('telefone = ?'); params.push(telefone); }
      if (password !== undefined && password !== '') {
        const pwError = validatePasswordStrength(password);
        if (pwError) return res.status(400).json({ error: pwError });
        const hash = await bcrypt.hash(password, 10);
        updates.push('password = ?');
        params.push(hash);
      }

      if (updates.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

      params.push(req.params.id);
      await run(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`, params);
      res.json({ ok: true });

      logAudit({
        user_id: req.user?.id,
        username: req.user?.username,
        acao: 'atualizou',
        entidade: 'Usuário',
        entidade_id: String(req.params.id),
        descricao: `Usuário ${exists.username} atualizado`,
        dados_antigos: cleanData(exists),
        dados_novos: cleanData(req.body),
        ip: req.ip,
      }).catch(err => console.error('Audit log error:', err));
    } catch (error) {
      if (error.message && error.message.includes('unique')) {
        return res.status(409).json({ error: 'Username já existe' });
      }
      handleError(res, error, 'usuarios');
    }
  });

  app.delete('/api/usuarios/:id', requireRole('admin', 'root'), async (req, res) => {
    try {
      const user = await get('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
      if (user.role === 'root') return res.status(403).json({ error: 'Não é possível excluir o usuário root' });
      await run('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
      res.json({ ok: true });

      logAudit({
        user_id: req.user?.id,
        username: req.user?.username,
        acao: 'excluiu',
        entidade: 'Usuário',
        entidade_id: String(req.params.id),
        descricao: `Usuário ${user.username} excluído`,
        dados_antigos: cleanData(user),
        ip: req.ip,
      }).catch(err => console.error('Audit log error:', err));
    } catch (error) {
      handleError(res, error, 'usuarios');
    }
  });
}

module.exports = { registerUsuariosRoutes };
