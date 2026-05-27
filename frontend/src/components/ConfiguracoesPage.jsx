import React, { useState, useEffect } from 'react';
import { fetchList, fetchUsers, createUser, updateUser, deleteUser, fetchOne, updateItem } from '../api/client';
import { MODULES } from '../modules/config';

const MODULE_OPTIONS = MODULES.filter(
  (m) => !['dashboard', 'configuracoes', 'versao'].includes(m.key)
);

const ROLES = ['root', 'admin', 'user'];

const defaultUserForm = () => ({
  username: '',
  password: '',
  role: 'user',
  ativo: true,
  permissoes: 'all'
});

function PermissionSelector({ value, onChange }) {
  const selected = value === 'all' ? MODULE_OPTIONS.map((m) => m.key) : (Array.isArray(value) ? value : []);

  const handleToggle = (moduleKey) => {
    let next;
    if (selected.includes(moduleKey)) {
      next = selected.filter((k) => k !== moduleKey);
    } else {
      next = [...selected, moduleKey];
    }
    onChange(next.length === MODULE_OPTIONS.length ? 'all' : next);
  };

  const handleSelectAll = () => onChange('all');
  const handleSelectNone = () => onChange([]);

  const isSelectAll = value === 'all';
  const isSelectNone = Array.isArray(value) && value.length === 0;

  return (
    <div className="permissoes-selector">
      <div className="permissoes-actions">
        <label className="perm-checkbox">
          <input type="checkbox" checked={isSelectAll} onChange={handleSelectAll} />
          Todos
        </label>
        <label className="perm-checkbox">
          <input type="checkbox" checked={isSelectNone} onChange={handleSelectNone} />
          Nenhum
        </label>
      </div>
      <div className="permissoes-grid">
        {MODULE_OPTIONS.map((mod) => (
          <label key={mod.key} className="perm-checkbox">
            <input
              type="checkbox"
              checked={selected.includes(mod.key)}
              onChange={() => handleToggle(mod.key)}
            />
            {mod.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function ConfiguracoesPage({ token, user: currentUser }) {
  const [config, setConfig] = useState({ codPais: '', idioma: '', cultureInfo: '' });
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState(defaultUserForm());
  const [editUserId, setEditUserId] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadConfig();
    loadUsers();
  }, []);

  const loadConfig = async () => {
    try {
      const row = await fetchOne('/api/configuracoes', '1', token);
      if (row && !row.error) setConfig(row);
    } catch (err) {
      console.error(err);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await fetchUsers(token);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfigChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfigSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await updateItem('/api/configuracoes', '1', config, token);
      setSuccess('Configurações salvas');
    } catch (err) {
      setError('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleUserFieldChange = (field, value) => {
    setUserForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditUser = (u) => {
    const perms = u.permissoes;
    let parsedPerms = perms;
    try { parsedPerms = JSON.parse(perms); } catch (_) {}
    setUserForm({
      username: u.username,
      password: '',
      role: u.role,
      ativo: !!u.ativo,
      permissoes: parsedPerms
    });
    setEditUserId(u.id);
    setShowUserForm(true);
  };

  const handleNewUser = () => {
    setUserForm(defaultUserForm());
    setEditUserId(null);
    setShowUserForm(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const data = {
        username: userForm.username,
        role: userForm.role,
        ativo: userForm.ativo,
        permissoes: Array.isArray(userForm.permissoes) ? JSON.stringify(userForm.permissoes) : userForm.permissoes
      };
      if (userForm.password) data.password = userForm.password;

      if (editUserId) {
        await updateUser(editUserId, data, token);
      } else {
        if (!userForm.password) {
          setError('Senha é obrigatória para novos usuários');
          setLoading(false);
          return;
        }
        await createUser(data, token);
      }
      setSuccess(editUserId ? 'Usuário atualizado' : 'Usuário criado');
      setShowUserForm(false);
      loadUsers();
    } catch (err) {
      setError(err.error || 'Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Deseja excluir o usuário "${u.username}"?`)) return;
    if (u.role === 'root') {
      setError('Não é possível excluir o usuário root');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await deleteUser(u.id, token);
      setSuccess('Usuário excluído');
      loadUsers();
    } catch (err) {
      setError(err.error || 'Erro ao excluir usuário');
    } finally {
      setLoading(false);
    }
  };

  const isRoot = currentUser?.role === 'root';

  return (
    <div className="module-container">
      <h2>Configurações</h2>
      {error && <div className="module-error">{error}</div>}
      {success && <div className="module-success">{success}</div>}

      <div className="config-section">
        <h3>Configurações do Sistema</h3>
        <form onSubmit={handleConfigSave} className="config-form">
          <label>País</label>
          <input value={config.codPais || ''} onChange={(e) => handleConfigChange('codPais', e.target.value)} />
          <label>Idioma</label>
          <input value={config.idioma || ''} onChange={(e) => handleConfigChange('idioma', e.target.value)} />
          <label>Culture Info</label>
          <input value={config.cultureInfo || ''} onChange={(e) => handleConfigChange('cultureInfo', e.target.value)} />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>

      <div className="config-section">
        <div className="section-header">
          <h3>Usuários</h3>
          {isRoot && (
            <button className="btn-primary" onClick={handleNewUser}>Novo Usuário</button>
          )}
        </div>

        {showUserForm && (
          <form onSubmit={handleUserSubmit} className="user-form">
            <h4>{editUserId ? 'Editar Usuário' : 'Novo Usuário'}</h4>
            <div className="form-grid">
              <label>Username</label>
              <input
                value={userForm.username}
                onChange={(e) => handleUserFieldChange('username', e.target.value)}
                required
              />
              <label>Senha {editUserId ? '(deixe vazio para manter)' : ''}</label>
              <input
                type="password"
                value={userForm.password}
                onChange={(e) => handleUserFieldChange('password', e.target.value)}
                required={!editUserId}
              />
              <label>Função</label>
              <select value={userForm.role} onChange={(e) => handleUserFieldChange('role', e.target.value)}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <label>Ativo</label>
              <input
                type="checkbox"
                checked={userForm.ativo}
                onChange={(e) => handleUserFieldChange('ativo', e.target.checked)}
              />
            </div>
            <div className="form-field">
              <label>Permissões de Visualização</label>
              <PermissionSelector
                value={userForm.permissoes}
                onChange={(val) => handleUserFieldChange('permissoes', val)}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowUserForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        <table className="entity-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Função</th>
              <th>Ativo</th>
              <th>Permissões</th>
              {isRoot && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={isRoot ? 6 : 5}>Nenhum usuário</td></tr>
            ) : users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.role}</td>
                <td>{u.ativo ? 'Sim' : 'Não'}</td>
                <td>
                  {u.permissoes === 'all'
                    ? 'Todos'
                    : (() => {
                        try {
                          const p = JSON.parse(u.permissoes);
                          return Array.isArray(p)
                            ? p.map((k) => MODULES.find((m) => m.key === k)?.label || k).join(', ')
                            : u.permissoes;
                        } catch (_) {
                          return u.permissoes;
                        }
                      })()
                  }
                </td>
                {isRoot && (
                  <td className="actions-cell">
                    <button className="btn-icon" onClick={() => handleEditUser(u)} title="Editar">✏️</button>
                    <button className="btn-icon" onClick={() => handleDeleteUser(u)} title="Excluir" disabled={u.role === 'root'}>🗑️</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
