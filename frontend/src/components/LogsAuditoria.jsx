import React, { useState, useEffect } from 'react';
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
      changes.push({
        field: key,
        old: oldParsed[key],
        new: newParsed[key],
      });
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
  const totalPages = Math.max(1, Math.ceil(total / ROWS_PER_PAGE));

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [page, loadId]);

  const fetchUsers = async () => {
    try {
      const data = await fetchList('/api/usuarios', token);
      setUsers(Array.isArray(data) ? data : []);
    } catch (_) {}
  };

  const loadLogs = async () => {
    setLoading(true);
    setError('');
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
      if (result && result.data) {
        setLogs(result.data);
        setTotal(result.total);
      } else {
        setLogs([]);
        setTotal(0);
      }
    } catch (err) {
      setError('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setPage(1);
    setLoadId((id) => id + 1);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return dateStr.replace('T', ' ').substring(0, 19);
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.substring(0, 10);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderValue = (val) => {
    if (val === null || val === undefined) return <span className="log-null">null</span>;
    if (typeof val === 'boolean') return <span>{val ? 'Sim' : 'Não'}</span>;
    if (typeof val === 'object') return <pre className="log-json-inline">{JSON.stringify(val, null, 2)}</pre>;
    return <span>{String(val)}</span>;
  };

  const renderDiff = (log) => {
    const changes = diffObjects(log.dados_antigos, log.dados_novos);
    if (!changes) return null;
    return (
      <table className="log-diff-table">
        <thead>
          <tr>
            <th>Campo</th>
            <th>Valor Antigo</th>
            <th>Valor Novo</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((c, i) => (
            <tr key={i}>
              <td className="log-diff-field">{c.field}</td>
              <td className="log-diff-old">{renderValue(c.old)}</td>
              <td className="log-diff-new">{renderValue(c.new)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="module-container">
      <h2>Logs de Auditoria</h2>
      {error && <div className="module-error">{error}</div>}

      <div className="logs-filters">
        <div className="form-group">
          <label className="form-label">Usuário</label>
          <select
            className="form-input"
            value={filterUsername}
            onChange={(e) => setFilterUsername(e.target.value)}
          >
            <option value="">Todos</option>
            {users.map((u) => (
              <option key={u.id} value={u.username}>{u.username}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Ação</label>
          <select
            className="form-input"
            value={filterAcao}
            onChange={(e) => setFilterAcao(e.target.value)}
          >
            <option value="">Todas</option>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Entidade</label>
          <input
            className="form-input"
            type="text"
            value={filterEntidade}
            onChange={(e) => setFilterEntidade(e.target.value)}
            placeholder="Ex: Veículo, Usuário..."
          />
        </div>
        <div className="form-group">
          <label className="form-label">Data Início</label>
          <input
            className="form-input"
            type="date"
            value={filterDataInicio}
            onChange={(e) => setFilterDataInicio(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Data Fim</label>
          <input
            className="form-input"
            type="date"
            value={filterDataFim}
            onChange={(e) => setFilterDataFim(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleFilter} disabled={loading}>
          {loading ? 'Carregando...' : 'Filtrar'}
        </button>
      </div>

      {loading ? (
        <p>Carregando logs...</p>
      ) : logs.length === 0 ? (
        <p>Nenhum log encontrado.</p>
      ) : (
        <>
          <div className="logs-table-wrapper">
            <table className="entity-table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Usuário</th>
                  <th>Ação</th>
                  <th>Entidade</th>
                  <th>ID</th>
                  <th>Descrição</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr
                      className="log-row"
                      onClick={() => toggleExpand(log.id)}
                    >
                      <td>{formatDate(log.created_at)}</td>
                      <td>{log.username}</td>
                      <td>
                        <span className={`log-badge log-badge-${log.acao.replace(' ', '-')}`}>
                          {ACTION_LABELS[log.acao] || log.acao}
                        </span>
                      </td>
                      <td>{log.entidade}</td>
                      <td>{log.entidade_id || '-'}</td>
                      <td>{log.descricao || '-'}</td>
                      <td>
                        <button className="btn-icon" title="Ver detalhes">
                          {expandedId === log.id ? '▲' : '▼'}
                        </button>
                      </td>
                    </tr>
                    {expandedId === log.id && (
                      <tr className="log-details-row">
                        <td colSpan={7}>
                          <div className="log-details">
                            {log.acao === 'atualizou' && log.dados_antigos && log.dados_novos ? (
                              <div className="log-diff-section">
                                <h4>Alterações</h4>
                                {renderDiff(log)}
                              </div>
                            ) : (
                              <>
                                {log.dados_antigos && (
                                  <div className="log-diff">
                                    <h4>Dados Antigos</h4>
                                    <pre className="log-json">
                                      {JSON.stringify(
                                        typeof log.dados_antigos === 'string'
                                          ? JSON.parse(log.dados_antigos)
                                          : log.dados_antigos,
                                        null, 2
                                      )}
                                    </pre>
                                  </div>
                                )}
                                {log.dados_novos && (
                                  <div className="log-diff">
                                    <h4>Dados Novos</h4>
                                    <pre className="log-json">
                                      {JSON.stringify(
                                        typeof log.dados_novos === 'string'
                                          ? JSON.parse(log.dados_novos)
                                          : log.dados_novos,
                                        null, 2
                                      )}
                                    </pre>
                                  </div>
                                )}
                              </>
                            )}
                            {!log.dados_antigos && !log.dados_novos && (
                              <p className="log-no-data">Sem dados detalhados</p>
                            )}
                            {log.ip && (
                              <p className="log-ip">IP: {log.ip}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="logs-pagination">
            <span className="logs-pagination-info">
              {total} registro(s) — Página {page} de {totalPages}
            </span>
            <div className="logs-pagination-buttons">
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(1)}
                title="Primeira página"
              >
                {'<<'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                title="Página anterior"
              >
                {'<'}
              </button>
              <span className="logs-pagination-current">{page}</span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                title="Próxima página"
              >
                {'>'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                title="Última página"
              >
                {'>>'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
