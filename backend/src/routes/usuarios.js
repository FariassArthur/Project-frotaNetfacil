const bcrypt = require('bcryptjs');
const { run, get, all } = require('../database/connection');
const { logAudit } = require('../services/auditLog');
const { handleError } = require('../services/errorHandler');

const SENSITIVE_FIELDS = ['password'];

function cleanData(data) {
  if (!data) return null;
  const cleaned = { ...data };
  SENSITIVE_FIELDS.forEach((f) => delete cleaned[f]);
  return cleaned;
}

function registerUsuariosRoutes(app) {
  app.get('/api/usuarios', async (req, res) => {
    try {
      const rows = await all('SELECT id, username, role, ativo, permissoes FROM usuarios ORDER BY username');
      res.json(rows);
    } catch (error) {
      handleError(res, error, 'usuarios');
    }
  });

  app.get('/api/usuarios/:id', async (req, res) => {
    try {
      const row = await get('SELECT id, username, role, ativo, permissoes FROM usuarios WHERE id = ?', [req.params.id]);
      if (!row) return res.status(404).json({ error: 'Usuário não encontrado' });
      res.json(row);
    } catch (error) {
      handleError(res, error, 'usuarios');
    }
  });

  app.post('/api/usuarios', async (req, res) => {
    const { username, password, role, ativo, permissoes } = req.body || {};
    try {
      if (!username || !password) return res.status(400).json({ error: 'username e password são obrigatórios' });
      const hash = await bcrypt.hash(password, 10);
      const result = await run(
        'INSERT INTO usuarios (username, password, role, ativo, permissoes) VALUES (?, ?, ?, ?, ?) RETURNING id',
        [username, hash, role || 'user', ativo !== false ? 1 : 0, permissoes || 'all']
      );
      res.status(201).json({ ok: true, id: result.rows[0].id });

      logAudit({
        user_id: req.user?.id,
        username: req.user?.username,
        acao: 'criou',
        entidade: 'Usuário',
        entidade_id: String(result.rows[0].id),
        descricao: `Usuário ${username} criado`,
        dados_novos: cleanData(req.body),
        ip: req.ip,
      }).catch(() => {});
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
      if (newPassword.length < 3) {
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 3 caracteres' });
      }
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
      }).catch(() => {});
    } catch (error) {
      handleError(res, error, 'usuarios');
    }
  });

  app.put('/api/usuarios/:id', async (req, res) => {
    const { username, password, role, ativo, permissoes } = req.body || {};
    try {
      const exists = await get('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
      if (!exists) return res.status(404).json({ error: 'Usuário não encontrado' });

      const updates = [];
      const params = [];

      if (username !== undefined) { updates.push('username = ?'); params.push(username); }
      if (role !== undefined) { updates.push('role = ?'); params.push(role); }
      if (ativo !== undefined) { updates.push('ativo = ?'); params.push(ativo ? 1 : 0); }
      if (permissoes !== undefined) { updates.push('permissoes = ?'); params.push(permissoes); }
      if (password !== undefined && password !== '') {
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
      }).catch(() => {});
    } catch (error) {
      if (error.message && error.message.includes('unique')) {
        return res.status(409).json({ error: 'Username já existe' });
      }
      handleError(res, error, 'usuarios');
    }
  });

  app.delete('/api/usuarios/:id', async (req, res) => {
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
      }).catch(() => {});
    } catch (error) {
      handleError(res, error, 'usuarios');
    }
  });
}

module.exports = { registerUsuariosRoutes };
