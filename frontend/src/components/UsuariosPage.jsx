import React, { useState, useEffect, useCallback } from 'react';
import { FaUserPlus, FaTrash, FaSave } from 'react-icons/fa';
import { fetchUsers, createUser, updateUser, deleteUser } from '../api/client';
import Skeleton from './Skeleton';

export default function UsuariosPage({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: '', password: '', role: 'user', ativo: true, permissoes: 'all' });
  const [editId, setEditId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUsers(token);
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.username) return;
    const body = { ...form };
    if (!body.password) { delete body.password; }
    try {
      if (editId) {
        await updateUser(editId, body, token);
      } else {
        await createUser(body, token);
      }
      setForm({ username: '', password: '', role: 'user', ativo: true, permissoes: 'all' });
      setEditId(null);
      load();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir usuário?')) return;
    try {
      await deleteUser(id, token);
      load();
    } catch (e) { console.error(e); }
  };

  const startEdit = (u) => {
    setEditId(u.id);
    setForm({ username: u.username, password: '', role: u.role, ativo: !!u.ativo, permissoes: u.permissoes || 'all' });
  };

  const inputClass = 'w-full px-3 py-2 rounded-lg border text-sm outline-none';
  const labelClass = 'text-xs font-semibold mb-1 block';

  if (loading) return <div className="p-6"><Skeleton type="card" rows={4} /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <FaUserPlus style={{ color: 'var(--orange)' }} /> Usuários
      </h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="p-4 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{editId ? 'Editar' : 'Novo'} Usuário</h3>
          <div className="space-y-3">
            <div>
              <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Usuário</label>
              <input className={inputClass} value={form.username}
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Senha {editId ? '(deixe vazio para manter)' : ''}</label>
              <input type="password" className={inputClass} value={form.password}
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Perfil</label>
              <select className={inputClass} value={form.role}
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
                <option value="root">Root</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ativo-input" checked={form.ativo}
                onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} />
              <label htmlFor="ativo-input" className="text-sm" style={{ color: 'var(--text-secondary)' }}>Ativo</label>
            </div>
            <button onClick={handleSave} disabled={!form.username}
              className="w-full px-4 py-2.5 rounded-[12px] font-semibold text-sm text-white border-none cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
              style={{ background: 'var(--orange)' }}>
              <FaSave size={14} /> {editId ? 'Atualizar' : 'Criar'}
            </button>
            {editId && (
              <button onClick={() => { setEditId(null); setForm({ username: '', password: '', role: 'user', ativo: true, permissoes: 'all' }); }}
                className="w-full px-4 py-2 rounded-lg text-sm border cursor-pointer"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}>
                Cancelar
              </button>
            )}
          </div>
        </div>

        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm table-sticky-header">
              <thead>
                <tr style={{ background: 'var(--table-header-bg)' }}>
                  <th className="px-4 py-3 text-left font-bold border-b whitespace-nowrap" style={{ color: 'var(--text-primary)', position: 'sticky', top: 0, zIndex: 11 }}>Usuário</th>
                  <th className="px-4 py-3 text-left font-bold border-b whitespace-nowrap" style={{ color: 'var(--text-primary)', position: 'sticky', top: 0, zIndex: 11 }}>Perfil</th>
                  <th className="px-4 py-3 text-center font-bold border-b whitespace-nowrap" style={{ color: 'var(--text-primary)', position: 'sticky', top: 0, zIndex: 11 }}>Ativo</th>
                  <th className="px-4 py-3 text-center font-bold border-b whitespace-nowrap" style={{ color: 'var(--text-primary)', position: 'sticky', top: 0, zIndex: 11 }}>Permissões</th>
                  <th className="px-4 py-3 text-center font-bold border-b whitespace-nowrap" style={{ color: 'var(--text-primary)', position: 'sticky', top: 0, zIndex: 11 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="hover:[background:var(--table-row-hover)]" style={{ color: 'var(--text-secondary)' }}>
                    <td className="px-4 py-3 border-b font-medium" style={{ color: 'var(--text-primary)' }}>{u.username}</td>
                    <td className="px-4 py-3 border-b"><span className="px-2 py-0.5 rounded text-xs font-semibold" style={{
                      background: u.role === 'root' ? 'var(--danger-bg)' : u.role === 'admin' ? 'var(--orange-bg)' : 'var(--card-bg)',
                      color: u.role === 'root' ? 'var(--danger)' : u.role === 'admin' ? 'var(--orange)' : 'var(--text-secondary)',
                    }}>{u.role}</span></td>
                    <td className="px-4 py-3 border-b text-center" style={{ color: u.ativo ? 'var(--success)' : 'var(--danger)' }}>{u.ativo ? 'Sim' : 'Não'}</td>
                    <td className="px-4 py-3 border-b text-center" style={{ color: 'var(--text-muted)' }}>{u.permissoes}</td>
                    <td className="px-4 py-3 border-b text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => startEdit(u)} className="px-3 py-1.5 text-xs rounded-[6px] font-semibold border cursor-pointer"
                          style={{ background: 'var(--orange)', color: 'white', borderColor: 'transparent' }}>
                          Editar
                        </button>
                        <button onClick={() => handleDelete(u.id)} className="px-3 py-1.5 text-xs rounded-[6px] font-semibold border cursor-pointer"
                          style={{ background: 'var(--danger)', color: 'white', borderColor: 'transparent' }}>
                          <FaTrash size={10} className="inline mr-1" /> Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-6 border-b" style={{ color: 'var(--text-muted)' }}>Nenhum usuário encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
