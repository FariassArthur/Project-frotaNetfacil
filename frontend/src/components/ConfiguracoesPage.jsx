import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
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
    <div className="border rounded-xl p-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
      <div className="flex gap-4 mb-3">
        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm cursor-pointer border"
          style={{ background: isSelectAll ? 'var(--orange-bg)' : 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
          <input type="checkbox" checked={isSelectAll} onChange={handleSelectAll} className="accent-[var(--orange)]" />
          Todos
        </label>
        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm cursor-pointer border"
          style={{ background: isSelectNone ? 'var(--orange-bg)' : 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
          <input type="checkbox" checked={isSelectNone} onChange={handleSelectNone} className="accent-[var(--orange)]" />
          Nenhum
        </label>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {MODULE_OPTIONS.map((mod) => (
          <label key={mod.key} className="flex items-center gap-1.5 px-2 py-1 rounded text-sm cursor-pointer hover:bg-[var(--orange-bg)]"
            style={{ color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              className="accent-[var(--orange)]"
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

  useEffect(() => { loadConfig(); loadUsers(); }, []);

  const loadConfig = async () => {
    try {
      const row = await fetchOne('/api/configuracoes', '1', token);
      if (row && !row.error) setConfig(row);
    } catch (err) { console.error(err); }
  };

  const loadUsers = async () => {
    try {
      const data = await fetchUsers(token);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const handleConfigChange = (field, value) => setConfig((prev) => ({ ...prev, [field]: value }));

  const handleConfigSave = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await updateItem('/api/configuracoes', '1', config, token);
      setSuccess('Configurações salvas');
    } catch (err) { setError('Erro ao salvar configurações'); }
    finally { setLoading(false); }
  };

  const handleUserFieldChange = (field, value) => setUserForm((prev) => ({ ...prev, [field]: value }));

  const handleEditUser = (u) => {
    const perms = u.permissoes;
    let parsedPerms = perms;
    try { parsedPerms = JSON.parse(perms); } catch (e) { console.error('Erro ao parsear permissões:', e); }
    setUserForm({ username: u.username, password: '', role: u.role, ativo: !!u.ativo, permissoes: parsedPerms });
    setEditUserId(u.id);
    setShowUserForm(true);
  };

  const handleNewUser = () => { setUserForm(defaultUserForm()); setEditUserId(null); setShowUserForm(true); };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const data = {
        username: userForm.username, role: userForm.role, ativo: userForm.ativo,
        permissoes: Array.isArray(userForm.permissoes) ? JSON.stringify(userForm.permissoes) : userForm.permissoes
      };
      if (userForm.password) data.password = userForm.password;
      if (editUserId) { await updateUser(editUserId, data, token); }
      else {
        if (!userForm.password) { setError('Senha é obrigatória para novos usuários'); setLoading(false); return; }
        await createUser(data, token);
      }
      setSuccess(editUserId ? 'Usuário atualizado' : 'Usuário criado');
      setShowUserForm(false);
      loadUsers();
    } catch (err) { setError(err.error || 'Erro ao salvar usuário'); }
    finally { setLoading(false); }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Deseja excluir o usuário "${u.username}"?`)) return;
    if (u.role === 'root') { setError('Não é possível excluir o usuário root'); return; }
    setLoading(true); setError(''); setSuccess('');
    try { await deleteUser(u.id, token); setSuccess('Usuário excluído'); loadUsers(); }
    catch (err) { setError(err.error || 'Erro ao excluir usuário'); }
    finally { setLoading(false); }
  };

  const isRoot = currentUser?.role === 'root';

  const inputBase = 'w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors';

  return (
    <div className="p-6" style={{ background: 'var(--bg-primary)' }}>
      <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Configurações</h2>
      {error && <div className="p-3 rounded-lg text-sm mb-4 border" style={{ background: 'var(--orange-bg)', color: 'var(--danger)', borderColor: 'var(--border-light)' }}>{error}</div>}
      {success && <div className="p-3 rounded-lg text-sm mb-4 border" style={{ background: 'rgba(40,167,69,0.1)', color: 'var(--success)', borderColor: 'rgba(40,167,69,0.2)' }}>{success}</div>}

      <div className="rounded-xl border p-6 mb-6" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
        <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Configurações do Sistema</h3>
        <form onSubmit={handleConfigSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>País</label>
          <input className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            value={config.codPais || ''} onChange={(e) => handleConfigChange('codPais', e.target.value)} />
          <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Idioma</label>
          <input className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            value={config.idioma || ''} onChange={(e) => handleConfigChange('idioma', e.target.value)} />
          <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Culture Info</label>
          <input className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            value={config.cultureInfo || ''} onChange={(e) => handleConfigChange('cultureInfo', e.target.value)} />
          <button type="submit" disabled={loading}
            className="px-5 py-2.5 rounded-[12px] font-semibold text-sm text-white border-none cursor-pointer shadow-lg disabled:opacity-60 col-start-2"
            style={{ background: 'var(--orange)', boxShadow: '0 8px 20px rgba(255,125,40,0.2)' }}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>

      <div className="rounded-xl border p-6" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Usuários</h3>
          {isRoot && (
            <button className="px-5 py-2.5 rounded-[12px] font-semibold text-sm text-white border-none cursor-pointer shadow-lg"
              style={{ background: 'var(--orange)', boxShadow: '0 8px 20px rgba(255,125,40,0.2)' }}
              onClick={handleNewUser}>Novo Usuário</button>
          )}
        </div>

        {showUserForm && (
          <form onSubmit={handleUserSubmit} className="rounded-xl border p-4 mb-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
            <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{editUserId ? 'Editar Usuário' : 'Novo Usuário'}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Username</label>
              <input className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                value={userForm.username} onChange={(e) => handleUserFieldChange('username', e.target.value)} required />
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Senha {editUserId ? '(deixe vazio para manter)' : ''}</label>
              <input className={inputBase} type="password" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                value={userForm.password} onChange={(e) => handleUserFieldChange('password', e.target.value)} required={!editUserId} />
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Função</label>
              <select className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                value={userForm.role} onChange={(e) => handleUserFieldChange('role', e.target.value)}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Ativo</label>
              <div className="flex items-center">
                <input type="checkbox" className="w-4 h-4 accent-[var(--orange)]"
                  checked={userForm.ativo} onChange={(e) => handleUserFieldChange('ativo', e.target.checked)} />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>Permissões de Visualização</label>
              <PermissionSelector value={userForm.permissoes} onChange={(val) => handleUserFieldChange('permissoes', val)} />
            </div>
            <div className="flex gap-3 mt-4">
              <button type="submit" disabled={loading}
                className="px-5 py-2.5 rounded-[12px] font-semibold text-sm text-white border-none cursor-pointer shadow-lg disabled:opacity-60"
                style={{ background: 'var(--orange)', boxShadow: '0 8px 20px rgba(255,125,40,0.2)' }}>
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
              <button type="button"
                className="px-5 py-2.5 rounded-[12px] font-semibold text-sm border cursor-pointer"
                style={{ background: 'var(--orange-bg)', color: 'var(--orange-dark)', borderColor: 'var(--border-light)' }}
                onClick={() => setShowUserForm(false)}>Cancelar</button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr style={{ background: 'var(--table-header-bg)' }}>
                <th className="px-4 py-3 text-left font-bold border-b" style={{ color: 'var(--text-primary)' }}>ID</th>
                <th className="px-4 py-3 text-left font-bold border-b" style={{ color: 'var(--text-primary)' }}>Username</th>
                <th className="px-4 py-3 text-left font-bold border-b" style={{ color: 'var(--text-primary)' }}>Função</th>
                <th className="px-4 py-3 text-left font-bold border-b" style={{ color: 'var(--text-primary)' }}>Ativo</th>
                <th className="px-4 py-3 text-left font-bold border-b" style={{ color: 'var(--text-primary)' }}>Permissões</th>
                {isRoot && <th className="px-4 py-3 text-left font-bold border-b" style={{ color: 'var(--text-primary)' }}>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }} colSpan={isRoot ? 6 : 5}>Nenhum usuário</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:[background:var(--table-row-hover)]" style={{ color: 'var(--text-secondary)' }}>
                  <td className="px-4 py-3 border-b">{u.id}</td>
                  <td className="px-4 py-3 border-b">{u.username}</td>
                  <td className="px-4 py-3 border-b">{u.role}</td>
                  <td className="px-4 py-3 border-b">{u.ativo ? 'Sim' : 'Não'}</td>
                  <td className="px-4 py-3 border-b">
                    {u.permissoes === 'all' ? 'Todos' : (() => {
                      try {
                        const p = JSON.parse(u.permissoes);
                        return Array.isArray(p) ? p.map((k) => MODULES.find((m) => m.key === k)?.label || k).join(', ') : u.permissoes;
                      } catch (_) { return u.permissoes; }
                    })()}
                  </td>
                  {isRoot && (
                    <td className="px-4 py-3 border-b">
                      <div className="flex gap-2">
                        <button className="bg-transparent border-none cursor-pointer text-sm p-1 rounded hover:bg-[var(--orange-bg)]"
                          onClick={() => handleEditUser(u)} title="Editar"><FaEdit size={14} /></button>
                        <button className="bg-transparent border-none cursor-pointer text-sm p-1 rounded hover:bg-[var(--orange-bg)] disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={() => handleDeleteUser(u)} title="Excluir" disabled={u.role === 'root'}><FaTrash size={14} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
