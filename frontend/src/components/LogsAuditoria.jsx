import React, { useState, useEffect, useRef } from 'react';
import { fetchList } from '../api/client';

const ACTION_LABELS = {
  criou: 'Criou',
  atualizou: 'Atualizou',
  excluiu: 'Excluiu',
  login: 'Login',
  logout: 'Logout',
  'alterou senha': 'Alterou Senha',
};

const ROWS_PER_PAGE = 50;

function diffObjects(oldData, newData) {
  if (!oldData || !newData) return null;
  const oldParsed = typeof oldData === 'string' ? JSON.parse(oldData) : oldData;
  const newParsed = typeof newData === 'string' ? JSON.parse(newData) : newData;
  const changes = [];
  const allKeys = new Set([...Object.keys(oldParsed), ...Object.keys(newParsed)]);
  for (const key of allKeys) {
    const oldVal = JSON.stringify(oldParsed[key]);
    const newVal = JSON.stringify(newParsed[key]);
    if (oldVal !== newVal) {
      changes.push({ field: key, old: oldParsed[key], new: newParsed[key] });
    }
  }
  return changes.length > 0 ? changes : null;
}

export default function LogsAuditoria({ token, user }) {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [filterAcao, setFilterAcao] = useState('');
  const [filterEntidade, setFilterEntidade] = useState('');
  const [filterUsername, setFilterUsername] = useState('');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);
  const [loadId, setLoadId] = useState(0);
  const [pageJump, setPageJump] = useState('');
  const totalPages = Math.max(1, Math.ceil(total / ROWS_PER_PAGE));

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { loadLogs(); }, [page, loadId]);

  const fetchUsers = async () => {
    try { const data = await fetchList('/api/usuarios', token); setUsers(Array.isArray(data) ? data : []); }
    catch (_) {}
  };

  const loadLogs = async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      params.set('limit', String(ROWS_PER_PAGE));
      params.set('offset', String((page - 1) * ROWS_PER_PAGE));
      if (filterAcao) params.set('acao', filterAcao);
      if (filterEntidade) params.set('entidade', filterEntidade);
      if (filterUsername) params.set('username', filterUsername);
      if (filterDataInicio) params.set('data_inicio', filterDataInicio);
      if (filterDataFim) params.set('data_fim', filterDataFim);
      const result = await fetchList(`/api/logs?${params.toString()}`, token);
      if (result && result.data) { setLogs(result.data); setTotal(result.total); }
      else { setLogs([]); setTotal(0); }
    } catch (err) { setError('Erro ao carregar logs'); }
    finally { setLoading(false); }
  };

  const handleFilter = () => { setPage(1); setLoadId((id) => id + 1); };

  const formatDate = (dateStr) => dateStr ? dateStr.replace('T', ' ').substring(0, 19) : '-';

  const clearFilters = () => {
    setFilterAcao('');
    setFilterEntidade('');
    setFilterUsername('');
    setFilterDataInicio('');
    setFilterDataFim('');
    setPage(1);
    setLoadId((id) => id + 1);
  };

  const exportCSV = () => {
    const headers = ['Data/Hora', 'Usuário', 'Ação', 'Entidade', 'ID', 'Descrição'];
    const bom = '\uFEFF';
    const esc = (v) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = logs.map((log) => [
      formatDate(log.created_at),
      log.username,
      ACTION_LABELS[log.acao] || log.acao,
      log.entidade,
      log.entidade_id || '',
      log.descricao || '',
    ]);
    const blob = new Blob([bom + [headers.join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'logs_auditoria.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePageJump = (e) => {
    e.preventDefault();
    const p = parseInt(pageJump, 10);
    if (p >= 1 && p <= totalPages) {
      setPage(p);
      setPageJump('');
    }
  };

  const renderValue = (val) => {
    if (val === null || val === undefined) return <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>null</span>;
    if (typeof val === 'boolean') return <span>{val ? 'Sim' : 'Não'}</span>;
    if (typeof val === 'object') return <pre className="text-xs p-2 rounded overflow-x-auto max-w-md" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{JSON.stringify(val, null, 2)}</pre>;
    return <span>{String(val)}</span>;
  };

  const renderDiff = (log) => {
    const changes = diffObjects(log.dados_antigos, log.dados_novos);
    if (!changes) return null;
    return (
      <table className="w-full border-collapse text-xs mb-3">
        <thead>
          <tr style={{ background: 'var(--bg-secondary)' }}>
            <th className="px-3 py-2 text-left font-bold border-b" style={{ color: 'var(--text-primary)' }}>Campo</th>
            <th className="px-3 py-2 text-left font-bold border-b" style={{ color: 'var(--text-primary)' }}>Valor Antigo</th>
            <th className="px-3 py-2 text-left font-bold border-b" style={{ color: 'var(--text-primary)' }}>Valor Novo</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((c, i) => (
            <tr key={i} style={{ color: 'var(--text-secondary)' }}>
              <td className="px-3 py-2 border-b font-medium">{c.field}</td>
              <td className="px-3 py-2 border-b" style={{ color: 'var(--danger)' }}>{renderValue(c.old)}</td>
              <td className="px-3 py-2 border-b" style={{ color: 'var(--success)' }}>{renderValue(c.new)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const inputBase = 'w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors';

  return (
    <div className="p-6" style={{ background: 'var(--bg-primary)' }}>
      <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Logs de Auditoria</h2>
      {error && <div className="p-3 rounded-lg text-sm mb-4 border" style={{ background: 'var(--orange-bg)', color: 'var(--danger)', borderColor: 'var(--border-light)' }}>{error}</div>}

      <div className="flex gap-3 items-end flex-wrap mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Usuário</label>
          <select className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            value={filterUsername} onChange={(e) => setFilterUsername(e.target.value)}>
            <option value="">Todos</option>
            {users.map((u) => <option key={u.id} value={u.username}>{u.username}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Ação</label>
          <select className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            value={filterAcao} onChange={(e) => setFilterAcao(e.target.value)}>
            <option value="">Todas</option>
            {Object.entries(ACTION_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Entidade</label>
          <input className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            type="text" value={filterEntidade} onChange={(e) => setFilterEntidade(e.target.value)} placeholder="Ex: Veículo, Usuário..." />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Data Início</label>
          <input className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            type="date" value={filterDataInicio} onChange={(e) => setFilterDataInicio(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Data Fim</label>
          <input className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            type="date" value={filterDataFim} onChange={(e) => setFilterDataFim(e.target.value)} />
        </div>
        <button
          className="px-5 py-2.5 rounded-[12px] font-semibold text-sm text-white border-none cursor-pointer shadow-lg disabled:opacity-60"
          style={{ background: 'var(--orange)', boxShadow: '0 8px 20px rgba(255,125,40,0.2)' }}
          onClick={handleFilter} disabled={loading}>
          {loading ? 'Carregando...' : 'Filtrar'}
        </button>
        {(filterAcao || filterEntidade || filterUsername || filterDataInicio || filterDataFim) && (
          <button
            className="px-4 py-2.5 rounded-[12px] font-semibold text-sm border cursor-pointer"
            style={{ background: 'var(--orange-bg)', color: 'var(--orange-dark)', borderColor: 'var(--border-light)' }}
            onClick={clearFilters}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-12 justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
          <span className="inline-block w-4 h-4 border-2 border-[var(--orange)] border-t-transparent rounded-full animate-[spin_0.6s_linear_infinite]" />
          Carregando logs...
        </div>
      ) : logs.length === 0 ? (
        <p className="text-sm py-8" style={{ color: 'var(--text-muted)' }}>Nenhum log encontrado.</p>
      ) : (
        <>
          <div className="flex items-center justify-end mb-2">
            <button
              className="px-4 py-2 rounded-[12px] font-semibold text-sm text-white border-none cursor-pointer shadow-lg flex items-center gap-1.5"
              style={{ background: 'var(--orange)', boxShadow: '0 4px 12px rgba(255,125,40,0.2)' }}
              onClick={exportCSV}
            >
              &#11015; CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr style={{ background: 'var(--table-header-bg)' }}>
                  <th className="px-4 py-3 text-left font-bold border-b whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>Data/Hora</th>
                  <th className="px-4 py-3 text-left font-bold border-b whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>Usuário</th>
                  <th className="px-4 py-3 text-left font-bold border-b whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>Ação</th>
                  <th className="px-4 py-3 text-left font-bold border-b whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>Entidade</th>
                  <th className="px-4 py-3 text-left font-bold border-b whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>ID</th>
                  <th className="px-4 py-3 text-left font-bold border-b whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>Descrição</th>
                  <th className="px-4 py-3 text-left font-bold border-b whitespace-nowrap" style={{ color: 'var(--text-primary)' }}></th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="cursor-pointer hover:[background:var(--table-row-hover)]" style={{ color: 'var(--text-secondary)' }}
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                      <td className="px-4 py-3 border-b">{formatDate(log.created_at)}</td>
                      <td className="px-4 py-3 border-b">{log.username}</td>
                      <td className="px-4 py-3 border-b">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={{
                          background: log.acao === 'criou' ? 'var(--success-bg)' :
                            log.acao === 'atualizou' ? 'var(--info-bg)' :
                            log.acao === 'excluiu' ? 'var(--danger-bg)' :
                            log.acao === 'login' ? '#f0e6ff' :
                            'var(--orange-bg)',
                          color: log.acao === 'criou' ? 'var(--success)' :
                            log.acao === 'atualizou' ? '#0056b3' :
                            log.acao === 'excluiu' ? 'var(--danger)' :
                            log.acao === 'login' ? '#6f42c1' :
                            'var(--orange-dark)',
                        }}>
                          {ACTION_LABELS[log.acao] || log.acao}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b">{log.entidade}</td>
                      <td className="px-4 py-3 border-b">{log.entidade_id || '-'}</td>
                      <td className="px-4 py-3 border-b">{log.descricao || '-'}</td>
                      <td className="px-4 py-3 border-b">
                        <button className="bg-transparent border-none cursor-pointer text-sm p-1 rounded hover:bg-[var(--orange-bg)]" title="Ver detalhes">
                          {expandedId === log.id ? '▲' : '▼'}
                        </button>
                      </td>
                    </tr>
                    {expandedId === log.id && (
                      <tr style={{ background: 'var(--bg-secondary)' }}>
                        <td colSpan={7} className="px-6 py-4">
                          {log.acao === 'atualizou' && log.dados_antigos && log.dados_novos ? (
                            <div>
                              <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Alterações</h4>
                              {renderDiff(log)}
                            </div>
                          ) : (
                            <div className="flex gap-4">
                              {log.dados_antigos && (
                                <div className="flex-1">
                                  <h4 className="text-xs font-bold mb-1" style={{ color: 'var(--danger)' }}>Dados Antigos</h4>
                                  <pre className="text-xs bg-[var(--card-bg)] p-2 rounded border overflow-x-auto"
                                    style={{ borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}>
                                    {JSON.stringify(
                                      typeof log.dados_antigos === 'string' ? JSON.parse(log.dados_antigos) : log.dados_antigos,
                                      null, 2
                                    )}
                                  </pre>
                                </div>
                              )}
                              {log.dados_novos && (
                                <div className="flex-1">
                                  <h4 className="text-xs font-bold mb-1" style={{ color: 'var(--success)' }}>Dados Novos</h4>
                                  <pre className="text-xs bg-[var(--card-bg)] p-2 rounded border overflow-x-auto"
                                    style={{ borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}>
                                    {JSON.stringify(
                                      typeof log.dados_novos === 'string' ? JSON.parse(log.dados_novos) : log.dados_novos,
                                      null, 2
                                    )}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                          {!log.dados_antigos && !log.dados_novos && (
                            <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Sem dados detalhados</p>
                          )}
                          {log.ip && <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>IP: {log.ip}</p>}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {total} registro(s) — Página {page} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <form onSubmit={handlePageJump} className="flex items-center gap-1">
                <label htmlFor="page-jump" className="text-xs" style={{ color: 'var(--text-muted)' }}>Ir para:</label>
                <input
                  id="page-jump"
                  type="number"
                  min={1}
                  max={totalPages}
                  className="w-14 px-2 py-1 text-xs rounded-lg border outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                  value={pageJump}
                  onChange={(e) => setPageJump(e.target.value)}
                  placeholder="Nº"
                />
                <button type="submit" className="px-2 py-1 text-xs rounded-lg border cursor-pointer"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}>
                  Ir
                </button>
              </form>
              <div className="flex items-center gap-1">
                <button className="px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}
                  disabled={page <= 1} onClick={() => setPage(1)} title="Primeira página">{'<<'}</button>
                <button className="px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}
                  disabled={page <= 1} onClick={() => setPage((p) => p - 1)} title="Página anterior">{'<'}</button>
                <span className="px-3 py-1.5 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{page}</span>
                <button className="px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}
                  disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} title="Próxima página">{'>'}</button>
                <button className="px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}
                  disabled={page >= totalPages} onClick={() => setPage(totalPages)} title="Última página">{'>>'}</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
