import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaUserPlus, FaTrash, FaSave, FaTimes, FaSearch, FaDownload, FaTimesCircle } from 'react-icons/fa';
import { fetchListPaginated, createItem, updateItem, deleteItem } from '../api/client';
import Skeleton from './Skeleton';
import { useToast } from './Toast';

const PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;

const PERMISSION_MODULES = [
  { key: 'veiculos', label: 'Veículos', category: 'frota' },
  { key: 'manutencoes', label: 'Manutenções', category: 'frota' },
  { key: 'multas', label: 'Multas', category: 'frota' },
  { key: 'abastecimentos', label: 'Abastecimentos', category: 'frota' },
  { key: 'viagens', label: 'Viagens', category: 'frota' },
  { key: 'vistorias', label: 'Vistorias', category: 'frota' },
  { key: 'pneus', label: 'Pneus', category: 'frota' },
  { key: 'higienizacao', label: 'Higienização', category: 'frota' },
  { key: 'ordens-servico', label: 'Ordens de Serviço', category: 'frota' },
  { key: 'cnhs', label: 'Motoristas (CNH)', category: 'motoristas' },
  { key: 'seguradoras', label: 'Seguradoras', category: 'financeiro' },
  { key: 'contratos-seguro', label: 'Contratos Seguro', category: 'financeiro' },
  { key: 'pagamentos-seguro', label: 'Pagamentos Seguro', category: 'financeiro' },
  { key: 'pagamento-documentos', label: 'Pag. Documentos', category: 'financeiro' },
  { key: 'cidades', label: 'Cidades', category: 'cadastros' },
  { key: 'combustiveis', label: 'Combustíveis', category: 'cadastros' },
  { key: 'tipo-manutencao', label: 'Tipos Manutenção', category: 'cadastros' },
  { key: 'mecanicas', label: 'Mecânicas', category: 'cadastros' },
  { key: 'configuracoes', label: 'Configurações', category: 'admin' },
  { key: 'logs-auditoria', label: 'Logs Auditoria', category: 'admin' },
  { key: 'usuarios', label: 'Usuários', category: 'admin' },
];

const CATEGORIES = [
  { key: 'frota', label: 'Frota' },
  { key: 'motoristas', label: 'Motoristas' },
  { key: 'financeiro', label: 'Financeiro' },
  { key: 'cadastros', label: 'Cadastros' },
  { key: 'admin', label: 'Administração' },
];

function parsePermissoes(value) {
  if (!value || value === 'all') return { all: true };
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (parsed && typeof parsed === 'object') return parsed;
    return { all: true };
  } catch {
    return { all: true };
  }
}

function serializePermissoes(perms) {
  if (perms.all) return 'all';
  const mods = {};
  PERMISSION_MODULES.forEach(m => { if (perms[m.key]) mods[m.key] = true; });
  return Object.keys(mods).length > 0 ? JSON.stringify(mods) : 'all';
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const initialForm = {
  username: '',
  password: '',
  role: 'user',
  ativo: true,
  nome_completo: '',
  email: '',
  telefone: '',
  permissoes: 'all',
};

export default function UsuariosPage({ token, user }) {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ ...initialForm });
  const [editId, setEditId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const searchTimer = useRef(null);

  const currentPerms = parsePermissoes(form.permissoes);
  const isAllPerms = currentPerms.all;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      query.set('_page', String(page));
      query.set('_limit', String(pageSize));
      if (debouncedSearch) query.set('_q', debouncedSearch);
      const result = await fetchListPaginated(`/api/usuarios?${query.toString()}`, token);
      if (result.error) {
        setError(result.error);
        setUsers([]);
      } else {
        setUsers(Array.isArray(result.data) ? result.data : []);
        setTotalCount(result.total || 0);
      }
    } catch (err) {
      setError('Erro ao carregar usuários');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token, page, pageSize, debouncedSearch]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(searchTimer.current);
  }, [searchQuery]);

  const validateForm = () => {
    const errors = {};
    if (!form.username.trim()) errors.username = 'Usuário é obrigatório';
    if (!editId && !form.password) errors.password = 'Senha é obrigatória';
    if (form.password && form.password.length < 8) errors.password = 'Mínimo 8 caracteres';
    if (form.email && !validateEmail(form.email)) errors.email = 'Email inválido';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    const body = { ...form };
    body.permissoes = serializePermissoes(currentPerms);
    if (!body.password) delete body.password;
    try {
      if (editId) {
        await updateItem('/api/usuarios', editId, body, token);
        toast.success('Usuário atualizado com sucesso');
      } else {
        await createItem('/api/usuarios', body, token);
        toast.success('Usuário criado com sucesso');
      }
      closeForm();
      loadUsers();
    } catch (e) {
      const msg = e.message || 'Erro ao salvar usuário';
      setError(msg);
      toast.error(msg);
    }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Deseja excluir o usuário "${username}"?`)) return;
    try {
      await deleteItem('/api/usuarios', id, token);
      toast.success('Usuário excluído');
      loadUsers();
    } catch (e) {
      toast.error(e.message || 'Erro ao excluir');
    }
  };

  const startEdit = (u) => {
    setEditId(u.id);
    setForm({
      username: u.username || '',
      password: '',
      role: u.role || 'user',
      ativo: !!u.ativo,
      nome_completo: u.nome_completo || '',
      email: u.email || '',
      telefone: u.telefone || '',
      permissoes: u.permissoes || 'all',
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const openNewForm = () => {
    setEditId(null);
    setForm({ ...initialForm });
    setFormErrors({});
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditId(null);
    setForm({ ...initialForm });
    setFormErrors({});
  };

  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const togglePermission = (key) => {
    const perms = { ...currentPerms };
    if (key === 'all') {
      return { ...form, permissoes: perms.all ? 'none' : 'all' };
    }
    delete perms.all;
    perms[key] = !perms[key];
    const newPerms = Object.keys(perms).filter(k => perms[k]);
    return { ...form, permissoes: newPerms.length > 0 ? serializePermissoes(perms) : 'none' };
  };

  const handleToggleAllPerms = () => {
    const newVal = isAllPerms ? 'none' : 'all';
    setForm(prev => ({ ...prev, permissoes: newVal }));
  };

  const handleToggleModule = (key) => {
    const newForm = togglePermission(key);
    setForm(newForm);
  };

  const exportCSV = () => {
    if (!users.length) return;
    const headers = ['Usuário', 'Nome Completo', 'Email', 'Telefone', 'Perfil', 'Ativo', 'Permissões'];
    const bom = '\uFEFF';
    const esc = (v) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = users.map(u => [
      u.username,
      u.nome_completo || '',
      u.email || '',
      u.telefone || '',
      u.role,
      u.ativo ? 'Sim' : 'Não',
      u.permissoes || 'all',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'usuarios.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputClass = 'w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors';
  const labelClass = 'text-xs font-semibold mb-1 block';
  const btnBase = 'px-4 py-2 rounded-[12px] font-semibold text-sm border-none cursor-pointer transition-colors disabled:opacity-50';

  const renderRoleBadge = (role) => {
    const styles = {
      root: { bg: 'var(--danger-bg)', color: 'var(--danger)' },
      admin: { bg: 'var(--orange-bg)', color: 'var(--orange)' },
      user: { bg: 'var(--card-bg)', color: 'var(--text-secondary)' },
    };
    const s = styles[role] || styles.user;
    return (
      <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: s.bg, color: s.color }}>
        {role === 'root' ? 'Root' : role === 'admin' ? 'Admin' : 'Usuário'}
      </span>
    );
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <FaUserPlus style={{ color: 'var(--orange)' }} /> Usuários
        </h1>
        <button
          className={`${btnBase} text-white inline-flex items-center gap-2 shadow-lg`}
          style={{ background: 'var(--orange)', boxShadow: '0 8px 20px rgba(255,125,40,0.2)' }}
          onClick={openNewForm}
        >
          <FaUserPlus size={14} /> Novo Usuário
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm mb-4 border" style={{
          background: 'var(--orange-bg)', color: 'var(--danger)', borderColor: 'var(--border-light)',
        }}>
          <span>{error}</span>
          <button className="ml-auto bg-transparent border-none cursor-pointer" style={{ color: 'var(--danger)' }} onClick={() => setError('')}>
            <FaTimesCircle />
          </button>
        </div>
      )}

      <div className="flex gap-3 items-center flex-wrap mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <FaSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text" placeholder="Buscar por usuário, nome ou email..."
            className={inputClass}
            style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)', paddingLeft: '2.25rem' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer" style={{ color: 'var(--text-muted)' }} onClick={() => setSearchQuery('')}>
              <FaTimes size={12} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <label className="text-xs">Exibir:</label>
            <select
              className="px-2 py-1.5 rounded-lg border text-xs outline-none cursor-pointer"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button
            className="px-3 py-2 rounded-[12px] text-xs font-semibold border cursor-pointer inline-flex items-center gap-1.5"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}
            onClick={exportCSV}
          >
            <FaDownload size={12} /> CSV
          </button>
        </div>
      </div>

      {/* Main content: table + side panel */}
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          {loading ? (
            <Skeleton type="card" rows={5} />
          ) : (
            <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm table-sticky-header">
                  <thead>
                    <tr style={{ background: 'var(--table-header-bg)' }}>
                      <th className="px-4 py-3 text-left font-bold border-b whitespace-nowrap" style={{ color: 'var(--text-primary)', position: 'sticky', top: 0, zIndex: 11 }}>Usuário</th>
                      <th className="px-4 py-3 text-left font-bold border-b whitespace-nowrap" style={{ color: 'var(--text-primary)', position: 'sticky', top: 0, zIndex: 11 }}>Nome Completo</th>
                      <th className="px-4 py-3 text-left font-bold border-b whitespace-nowrap" style={{ color: 'var(--text-primary)', position: 'sticky', top: 0, zIndex: 11 }}>Email</th>
                      <th className="px-4 py-3 text-left font-bold border-b whitespace-nowrap" style={{ color: 'var(--text-primary)', position: 'sticky', top: 0, zIndex: 11 }}>Perfil</th>
                      <th className="px-4 py-3 text-center font-bold border-b whitespace-nowrap" style={{ color: 'var(--text-primary)', position: 'sticky', top: 0, zIndex: 11 }}>Ativo</th>
                      <th className="px-4 py-3 text-center font-bold border-b whitespace-nowrap" style={{ color: 'var(--text-primary)', position: 'sticky', top: 0, zIndex: 11 }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="hover:[background:var(--table-row-hover)]" style={{ color: 'var(--text-secondary)' }}>
                        <td className="px-4 py-3 border-b font-medium" style={{ color: 'var(--text-primary)' }}>{u.username}</td>
                        <td className="px-4 py-3 border-b">{u.nome_completo || <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                        <td className="px-4 py-3 border-b">{u.email || <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                        <td className="px-4 py-3 border-b">{renderRoleBadge(u.role)}</td>
                        <td className="px-4 py-3 border-b text-center" style={{ color: u.ativo ? 'var(--success)' : 'var(--danger)' }}>
                          {u.ativo ? 'Sim' : 'Não'}
                        </td>
                        <td className="px-4 py-3 border-b text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => startEdit(u)}
                              className="px-3 py-1.5 text-xs rounded-[6px] font-semibold border cursor-pointer"
                              style={{ background: 'var(--orange)', color: 'white', borderColor: 'transparent' }}>
                              Editar
                            </button>
                            <button onClick={() => handleDelete(u.id, u.username)}
                              className="px-3 py-1.5 text-xs rounded-[6px] font-semibold border cursor-pointer"
                              style={{ background: 'var(--danger)', color: 'white', borderColor: 'transparent' }}
                              disabled={u.role === 'root'}>
                              <FaTrash size={10} className="inline mr-1" /> Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && !loading && (
                      <tr><td colSpan={6} className="text-center py-8 border-b" style={{ color: 'var(--text-muted)' }}>
                        {debouncedSearch ? 'Nenhum usuário encontrado para esta busca.' : 'Nenhum usuário cadastrado.'}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalCount > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t flex-wrap gap-2" style={{ borderColor: 'var(--border-light)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, totalCount)} de {totalCount}
                  </span>
                  <div className="flex items-center gap-1">
                    <button className="px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}
                      disabled={page <= 1} onClick={() => setPage(1)}>{'<<'}</button>
                    <button className="px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}
                      disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{'<'}</button>
                    <span className="px-3 py-1.5 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{page}</span>
                    <button className="px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}
                      disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>{'>'}</button>
                    <button className="px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}
                      disabled={page >= totalPages} onClick={() => setPage(totalPages)}>{'>>'}</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Side panel form */}
        {formOpen && (
          <div className="w-[400px] shrink-0 rounded-xl border p-5 overflow-y-auto max-h-[calc(100vh-12rem)]"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                {editId ? 'Editar' : 'Novo'} Usuário
              </h3>
              <button onClick={closeForm} className="bg-transparent border-none cursor-pointer text-lg" style={{ color: 'var(--text-muted)' }}>
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Usuário *</label>
                <input className={inputClass}
                  style={{
                    background: 'var(--input-bg)', borderColor: formErrors.username ? 'var(--danger)' : 'var(--input-border)',
                    color: 'var(--text-primary)'
                  }}
                  value={form.username}
                  onChange={e => handleFieldChange('username', e.target.value)}
                  placeholder="Nome de usuário" />
                {formErrors.username && <span className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{formErrors.username}</span>}
              </div>

              <div>
                <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                  Senha {editId ? '(deixe vazio para manter)' : '*'}
                </label>
                <input type="password" className={inputClass}
                  style={{
                    background: 'var(--input-bg)', borderColor: formErrors.password ? 'var(--danger)' : 'var(--input-border)',
                    color: 'var(--text-primary)'
                  }}
                  value={form.password}
                  onChange={e => handleFieldChange('password', e.target.value)}
                  placeholder={editId ? 'Nova senha (opcional)' : 'Mínimo 8 caracteres'} />
                {formErrors.password && <span className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{formErrors.password}</span>}
                {form.password && form.password.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4].map(i => {
                      const hasUpper = /[A-Z]/.test(form.password);
                      const hasLower = /[a-z]/.test(form.password);
                      const hasDigit = /[0-9]/.test(form.password);
                      const hasLength = form.password.length >= 8;
                      const checks = [hasLength, hasLower, hasUpper, hasDigit];
                      return (
                        <div key={i} className="h-1.5 flex-1 rounded-full transition-colors"
                          style={{ background: checks.slice(0, i).every(Boolean) ? 'var(--success)' : 'var(--border-light)' }} />
                      );
                    })}
                    <span className="text-[10px] ml-1" style={{ color: 'var(--text-muted)' }}>
                      {form.password.length >= 8 && /[A-Z]/.test(form.password) && /[a-z]/.test(form.password) && /[0-9]/.test(form.password) ? 'Forte' : form.password.length >= 6 ? 'Média' : 'Fraca'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Nome Completo</label>
                <input className={inputClass}
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                  value={form.nome_completo}
                  onChange={e => handleFieldChange('nome_completo', e.target.value)}
                  placeholder="Nome completo" />
              </div>

              <div>
                <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Email</label>
                <input type="email" className={inputClass}
                  style={{
                    background: 'var(--input-bg)', borderColor: formErrors.email ? 'var(--danger)' : 'var(--input-border)',
                    color: 'var(--text-primary)'
                  }}
                  value={form.email}
                  onChange={e => handleFieldChange('email', e.target.value)}
                  placeholder="email@exemplo.com" />
                {formErrors.email && <span className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{formErrors.email}</span>}
              </div>

              <div>
                <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Telefone</label>
                <input className={inputClass}
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                  value={form.telefone}
                  onChange={e => handleFieldChange('telefone', e.target.value)}
                  placeholder="(XX) XXXXX-XXXX" />
              </div>

              <div>
                <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Perfil</label>
                <select className={inputClass}
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                  value={form.role}
                  onChange={e => handleFieldChange('role', e.target.value)}>
                  <option value="user">Usuário</option>
                  <option value="admin">Admin</option>
                  <option value="root">Root</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="ativo-input" checked={form.ativo}
                  className="w-4 h-4 accent-[var(--orange)] cursor-pointer"
                  onChange={e => handleFieldChange('ativo', e.target.checked)} />
                <label htmlFor="ativo-input" className="text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>Ativo</label>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <input type="checkbox" id="perm-all" checked={isAllPerms}
                    className="w-4 h-4 accent-[var(--orange)] cursor-pointer"
                    onChange={handleToggleAllPerms} />
                  <label htmlFor="perm-all" className="text-sm font-semibold cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                    Todas as permissões
                  </label>
                </div>
                {!isAllPerms && (
                  <div className="space-y-2 pl-1">
                    {CATEGORIES.map(cat => {
                      const catModules = PERMISSION_MODULES.filter(m => m.category === cat.key);
                      return (
                        <div key={cat.key}>
                          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{cat.label}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                            {catModules.map(m => (
                              <label key={m.key} className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                                <input type="checkbox" checked={!!currentPerms[m.key]}
                                  className="w-3.5 h-3.5 accent-[var(--orange)] cursor-pointer"
                                  onChange={() => handleToggleModule(m.key)} />
                                {m.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} disabled={!form.username}
                  className={`${btnBase} flex-1 text-white inline-flex items-center justify-center gap-2`}
                  style={{ background: 'var(--orange)' }}>
                  <FaSave size={14} /> {editId ? 'Atualizar' : 'Criar'}
                </button>
                <button onClick={closeForm}
                  className="px-4 py-2 rounded-[12px] text-sm border cursor-pointer"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
