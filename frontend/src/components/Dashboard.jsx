import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { FaDownload, FaSortUp, FaSortDown } from 'react-icons/fa';
import { fetchList } from '../api/client';
import { formatHeader, FilterDropdown } from '../utils/tableUtils.jsx';
import { requestNotificationPermission, notifyOverdue } from '../utils/notifications';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import Skeleton from './Skeleton';

const MODULE_ORDER = [
  'veiculos', 'cnhs', 'manutencoes', 'multas', 'abastecimentos',
  'contratos_seguro', 'pagamentos_seguro', 'pagamento_documentos', 'higienizacao',
  'mecanicas', 'seguradoras', 'cidades', 'combustiveis', 'tipo_manutencao'
];

const SENSITIVE_PREFIXES = ['password', 'path_'];

function formatCellValue(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
  const s = String(val);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s + 'T00:00:00');
    if (!isNaN(d)) return d.toLocaleDateString('pt-BR');
  }
  return s;
}

function rawDate(val) {
  if (!val) return null;
  const s = String(val);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return null;
}

function sanitizeRows(rows) {
  return rows.map((r) => {
    const copy = { ...r };
    for (const key of Object.keys(copy)) {
      if (SENSITIVE_PREFIXES.some((p) => key === p || key.startsWith(p))) {
        delete copy[key];
      }
    }
    return copy;
  });
}

function downloadCSV(filename, headers, rows) {
  const bom = '\uFEFF';
  const esc = (v) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const blob = new Blob([bom + [headers.join(','), ...rows.map(r => r.map(esc).join(','))].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function isDateColumn(col, rows) {
  if (/data|vencimento|validade|emissao|nascimento|aquisicao|pagamento|ocorrencia|inicial|final/.test(col)) {
    const sample = rows[0]?.[col];
    return sample != null && /^\d{4}-\d{2}-\d{2}/.test(String(sample));
  }
  return false;
}

function isNumColumn(col, rows) {
  const sample = rows[0]?.[col];
  if (sample == null) return false;
  if (['km', 'valor', 'quantidade', 'capacidade', 'potencia', 'combustivel'].includes(col)) return true;
  return typeof sample === 'number' || (!isNaN(Number(sample)) && String(sample).trim() !== '');
}

function getSortValue(row, col, dateCol) {
  const v = row[col];
  if (v == null) return -Infinity;
  if (dateCol) return rawDate(v) || v;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  const n = Number(v);
  return isNaN(n) ? String(v).toLowerCase() : n;
}

const SEARCH_DEBOUNCE_MS = 300;

export default function Dashboard({ token, onModuleSelect }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(null);
  const [search, setSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [openFilter, setOpenFilter] = useState(null);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [pagamentos, setPagamentos] = useState(null);
  const [showPagamentoModal, setShowPagamentoModal] = useState(null);
  const [expenseSummary, setExpenseSummary] = useState(null);
  const [manutencaoAlertas, setManutencaoAlertas] = useState(null);
  const [notificacoes, setNotificacoes] = useState(null);
  const [graficos, setGraficos] = useState(null);
  const [graficoAno, setGraficoAno] = useState(String(new Date().getFullYear()));
  const [graficoVeiculo, setGraficoVeiculo] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [csvConfirmOpen, setCsvConfirmOpen] = useState(false);
  const csvConfirmRef = useRef(null);
  const searchTimer = useRef(null);
  const filterBtnRefs = useRef({});

  const openFilterMenu = (col, e) => {
    if (openFilter === col) {
      setOpenFilter(null);
      setFilterAnchor(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setFilterAnchor(rect);
    setOpenFilter(col);
  };

  const tabs = useMemo(() => {
    return MODULE_ORDER
      .filter((k) => data[k] && data[k].columns && data[k].columns.length > 0)
      .map((k) => ({ key: k, ...data[k] }));
  }, [data]);

  useEffect(() => {
    if (tabs.length > 0 && !activeTab) setActiveTab(tabs[0].key);
  }, [tabs]);

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    requestNotificationPermission();

    fetchList('/api/dashboard/pagamentos', token).then((r) => {
      if (r && !r.error) {
        const safeResult = {
          noPrazo: { total: r.noPrazo?.total || 0, ...r.noPrazo },
          emAtraso: { total: r.emAtraso?.total || 0, ...r.emAtraso },
          atrasados: Array.isArray(r.atrasados) ? r.atrasados : [],
          noPrazoList: Array.isArray(r.noPrazoList) ? r.noPrazoList : [],
        };
        setPagamentos(safeResult);
        const prevIds = JSON.parse(localStorage.getItem('atrasadosIds') || '[]');
        const currIds = safeResult.atrasados.map(a => `${a.tipo}-${a.id}`);
        const newOnes = safeResult.atrasados.filter(a => !prevIds.includes(`${a.tipo}-${a.id}`));
        if (newOnes.length > 0) {
          notifyOverdue(newOnes);
        }
        localStorage.setItem('atrasadosIds', JSON.stringify(currIds));
      } else {
        setPagamentos({ noPrazo: { total: 0 }, emAtraso: { total: 0 }, atrasados: [], noPrazoList: [] });
      }
    }).catch((err) => {
      console.error('Erro ao carregar pagamentos:', err);
      setPagamentos({ noPrazo: { total: 0 }, emAtraso: { total: 0 }, atrasados: [], noPrazoList: [] });
    });

    fetchList('/api/gastos', token).then((r) => {
      if (r && !r.error && Array.isArray(r)) {
        setExpenseSummary(r);
      }
    }).catch(err => console.error('Audit log error:', err));

    fetchList('/api/manutencao-preventiva/alertas', token).then((r) => {
      if (r && !r.error) {
        setManutencaoAlertas(r);
      }
    }).catch(err => console.error('Audit log error:', err));

    fetchList('/api/dashboard/notificacoes', token).then((r) => {
      if (r && !r.error) {
        setNotificacoes(r);
        const prevNotifIds = JSON.parse(localStorage.getItem('notificacaoIds') || '[]');
        const currNotifIds = (r.atrasados || []).map(a => a.id);
        const newNotifs = (r.atrasados || []).filter(a => !prevNotifIds.includes(a.id));
        if (newNotifs.length > 0) {
          notifyOverdue(newNotifs);
        }
        localStorage.setItem('notificacaoIds', JSON.stringify(currNotifIds));
      }
    }).catch(err => console.error('Notificacoes error:', err));
  }, []);

  useEffect(() => {
    if (!graficoAno) return;
    const params = new URLSearchParams({ ano: graficoAno });
    if (graficoVeiculo) params.set('veiculo_id', graficoVeiculo);
    fetchList(`/api/dashboard/graficos?${params}`, token).then((r) => {
      if (r && !r.error) setGraficos(r);
    }).catch(err => console.error('Graficos error:', err));
  }, [graficoAno, graficoVeiculo]);

  useEffect(() => {
    setColumnFilters({});
    setOpenFilter(null);
    setSearch('');
  }, [activeTab]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchList('/api/dashboard', token);
      setData(result);
    } catch (err) {
      setError('Erro ao carregar dados');
      console.error(err);
    } finally { setLoading(false); }
  };

  const handleFilterChange = useCallback((col, filter) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      const hasFilter = filter.sort || (filter.hidden && filter.hidden.size > 0);
      if (hasFilter) next[col] = filter;
      else delete next[col];
      return next;
    });
  }, []);

  const activeSection = tabs.find((t) => t.key === activeTab);
  const displayCols = useMemo(() => {
    if (!activeSection) return [];
    return activeSection.columns.filter((c) => !SENSITIVE_PREFIXES.some((p) => c === p || c.startsWith(p)));
  }, [activeSection]);

  const dateCols = useMemo(() => {
    if (!activeSection) return {};
    const m = {};
    for (const c of displayCols) m[c] = isDateColumn(c, activeSection.rows);
    return m;
  }, [activeSection, displayCols]);

  const numCols = useMemo(() => {
    if (!activeSection) return {};
    const m = {};
    for (const c of displayCols) m[c] = isNumColumn(c, activeSection.rows);
    return m;
  }, [activeSection, displayCols]);

  const processedRows = useMemo(() => {
    if (!activeSection) return [];
    let rows = activeSection.rows;

    const activeFilters = Object.entries(columnFilters).filter(([, f]) => f.hidden && f.hidden.size > 0);
    if (activeFilters.length > 0) {
      rows = rows.filter((row) =>
        activeFilters.every(([col, f]) => {
          const v = String(row[col] ?? '');
          return !f.hidden.has(v);
        })
      );
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      rows = rows.filter((row) =>
        displayCols.some((col) => String(row[col] ?? '').toLowerCase().includes(q))
      );
    }

    const sortEntry = Object.entries(columnFilters).find(([, f]) => f.sort);
    if (sortEntry) {
      const [sortCol, { sort: dir }] = sortEntry;
      const isDate = dateCols[sortCol];
      rows = [...rows].sort((a, b) => {
        const va = getSortValue(a, sortCol, isDate);
        const vb = getSortValue(b, sortCol, isDate);
        if (va === -Infinity) return 1;
        if (vb === -Infinity) return -1;
        if (typeof va === 'string' && typeof vb === 'string') {
          return dir === 'desc' ? vb.localeCompare(va) : va.localeCompare(vb);
        }
        return dir === 'desc' ? vb - va : va - vb;
      });
    }

    return rows;
  }, [activeSection, columnFilters, debouncedSearch, displayCols, dateCols]);

  const hasActiveFilters = Object.keys(columnFilters).length > 0 || search.length > 0;

  const runExport = useRef(null);

  const doExport = () => {
    const lines = [];
    for (const tab of tabs) {
      const rows = sanitizeRows(tab.rows);
      const cols = (tab.columns || []).filter((c) => !SENSITIVE_PREFIXES.some((p) => c === p || c.startsWith(p)));
      lines.push(`TABELA:${tab.label || tab.key}`);
      lines.push(cols.map(formatHeader).join(','));
      for (const row of rows) {
        lines.push(cols.map((c) => {
          const value = formatCellValue(row[c]);
          const s = String(value ?? '');
          return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
        }).join(','));
      }
      lines.push('');
    }

    const bom = '\uFEFF';
    const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
      a.download = 'zenite_completo.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const totalRows = tabs.reduce((s, t) => s + (t.rows?.length || 0), 0);
    if (totalRows > 5000) {
      csvConfirmRef.current = doExport;
      setCsvConfirmOpen(true);
      return;
    }
    doExport();
  };

  useEffect(() => {
    if (!showPagamentoModal) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setShowPagamentoModal(null);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showPagamentoModal]);

  const clearFilters = () => {
    setColumnFilters({});
    setSearch('');
  };

  const COLORS = ['#ff7f1e', '#28a745', '#dc3545', '#007bff', '#6f42c1', '#fd7e14', '#20c997', '#e83e8c'];

  const chartData = useMemo(() => {
    if (!pagamentos || !pagamentos.noPrazo || !pagamentos.emAtraso) return null;
    return [
      { name: 'No prazo', value: pagamentos.noPrazo.total || 0, color: '#28a745' },
      { name: 'Em atraso', value: pagamentos.emAtraso.total || 0, color: '#dc3545' },
    ];
  }, [pagamentos]);

  if (loading) {
    return (
      <div className="p-6" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h2>
        </div>
        <Skeleton type="card" rows={4} />
      </div>
    );
  }

  const thClass = 'px-3.5 py-3 text-left text-sm font-bold border-b whitespace-nowrap cursor-pointer select-none';
  const tdClass = 'px-3.5 py-3 text-sm border-b';

  return (
    <div className="p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h2>
        <div className="flex gap-2">
          <button
            className="px-5 py-2.5 rounded-[12px] font-semibold text-sm text-white border-none cursor-pointer shadow-lg inline-flex items-center gap-1.5"
            style={{
              background: 'var(--orange)',
              boxShadow: '0 8px 20px rgba(255, 125, 40, 0.2)',
            }}
            onClick={exportCSV}
          >
            <FaDownload size={14} /> CSV — Planilha Geral
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm mb-4 border" style={{
          background: 'var(--orange-bg)',
          color: 'var(--danger)',
          borderColor: 'var(--border-light)',
        }}>
          {error}
        </div>
      )}

      {notificacoes && (notificacoes.totais?.cnh_expiradas > 0 || notificacoes.totais?.seguro_expirados > 0 || notificacoes.totais?.ipva_expirados > 0) && (
        <div className="flex gap-4 mb-6 flex-wrap">
          {notificacoes.totais.cnh_expiradas > 0 && (
            <div className="flex-1 min-w-[160px] p-4 rounded-xl border" style={{ background: 'rgba(220,53,69,0.08)', borderColor: 'var(--danger)' }}>
              <span className="text-2xl font-bold block" style={{ color: 'var(--danger)' }}>{notificacoes.totais.cnh_expiradas}</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>CNH vencida(s)</span>
            </div>
          )}
          {notificacoes.totais.cnh_expiram > 0 && (
            <div className="flex-1 min-w-[160px] p-4 rounded-xl border" style={{ background: 'rgba(255,193,7,0.12)', borderColor: '#ffc107' }}>
              <span className="text-2xl font-bold block" style={{ color: '#cc7a00' }}>{notificacoes.totais.cnh_expiram}</span>
              <span className="text-sm font-semibold" style={{ color: '#cc7a00' }}>CNH vence em 30 dias</span>
            </div>
          )}
          {notificacoes.totais.seguro_expirados > 0 && (
            <div className="flex-1 min-w-[160px] p-4 rounded-xl border" style={{ background: 'rgba(220,53,69,0.08)', borderColor: 'var(--danger)' }}>
              <span className="text-2xl font-bold block" style={{ color: 'var(--danger)' }}>{notificacoes.totais.seguro_expirados}</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>Seguro(s) vencido(s)</span>
            </div>
          )}
          {notificacoes.totais.ipva_expirados > 0 && (
            <div className="flex-1 min-w-[160px] p-4 rounded-xl border" style={{ background: 'rgba(220,53,69,0.08)', borderColor: 'var(--danger)' }}>
              <span className="text-2xl font-bold block" style={{ color: 'var(--danger)' }}>{notificacoes.totais.ipva_expirados}</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>IPVA vencido(s)</span>
            </div>
          )}
        </div>
      )}

      {pagamentos && pagamentos.noPrazo && pagamentos.emAtraso && (
        <div className="flex gap-4 mb-6">
          <button
            className="flex-1 p-4 rounded-xl border text-left cursor-pointer transition-transform hover:scale-[1.02]"
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--border-light)',
            }}
            onClick={() => setShowPagamentoModal('noPrazo')}
          >
            <span className="text-2xl font-bold block" style={{ color: 'var(--success)' }}>{pagamentos.noPrazo.total || 0}</span>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>No prazo</span>
          </button>
          <button
            className="flex-1 p-4 rounded-xl border text-left cursor-pointer transition-transform hover:scale-[1.02]"
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--border-light)',
            }}
            onClick={() => setShowPagamentoModal('atrasados')}
          >
            <span className="text-2xl font-bold block" style={{ color: 'var(--danger)' }}>{pagamentos.emAtraso.total || 0}</span>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Em atraso</span>
          </button>
        </div>
      )}

      <Modal open={showPagamentoModal === 'atrasados'} onClose={() => setShowPagamentoModal(null)} title="Pagamentos em Atraso" wide>
        <div className="flex justify-end px-4 pt-3 pb-1">
          <button className="px-4 py-2 rounded-[12px] font-semibold text-sm text-white border-none cursor-pointer shadow-lg inline-flex items-center gap-1.5" style={{ background: 'var(--orange)' }} onClick={() => {
            const headers = ['Tipo', 'Veículo', 'Descrição', 'Valor', 'Vencimento', 'Dias Atraso'];
            const rows = pagamentos.atrasados.map(i => [
              i.tipo, i.veiculo_id, i.descricao || '',
              `R$ ${(i.valor || 0).toFixed(2).replace('.', ',')}`,
              i.data_vencimento ? i.data_vencimento.split('-').reverse().join('/') : '',
              `${i.dias_atraso} dia(s)`,
            ]);
            downloadCSV('pagamentos_em_atraso.csv', headers, rows);
          }}><FaDownload size={14} /> CSV</button>
        </div>
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: 'var(--table-header-bg)' }}>
                <th className={thClass}>Tipo</th>
                <th className={thClass}>Veículo</th>
                <th className={thClass}>Descrição</th>
                <th className={thClass}>Valor</th>
                <th className={thClass}>Vencimento</th>
                <th className={thClass}>Dias</th>
              </tr>
            </thead>
            <tbody>
              {pagamentos.atrasados.map((item, i) => (
                <tr key={`${item.tipo}-${item.id}`} className="hover:[background:var(--table-row-hover)]" style={{ color: 'var(--text-secondary)', background: i % 2 === 0 ? 'rgba(239, 68, 68, 0.04)' : 'rgba(239, 68, 68, 0.09)' }}>
                  <td className={tdClass}>
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={{
                      background: item.tipo === 'Multa' ? 'var(--danger-bg)' : 'var(--orange-bg)',
                      color: item.tipo === 'Multa' ? 'var(--danger)' : 'var(--orange-dark)',
                    }}>
                      {item.tipo}
                    </span>
                  </td>
                  <td className={tdClass} style={{ color: 'var(--danger)' }}>{item.veiculo_id}</td>
                  <td className={tdClass}>{item.descricao || '-'}</td>
                  <td className={tdClass} style={{ color: 'var(--danger)', fontWeight: 600 }}>
                    R$ {(item.valor || 0).toFixed(2).replace('.', ',')}
                  </td>
                  <td className={tdClass} style={{ color: 'var(--danger)' }}>{item.data_vencimento ? item.data_vencimento.split('-').reverse().join('/') : '-'}</td>
                  <td className={tdClass} style={{ color: 'var(--danger)', fontWeight: 700 }}>{item.dias_atraso} dia(s)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      <Modal open={showPagamentoModal === 'noPrazo'} onClose={() => setShowPagamentoModal(null)} title="Pagamentos em Dia" wide>
        <div className="flex justify-end px-4 pt-3 pb-1">
          <button className="px-4 py-2 rounded-[12px] font-semibold text-sm text-white border-none cursor-pointer shadow-lg inline-flex items-center gap-1.5" style={{ background: 'var(--orange)' }} onClick={() => {
            const headers = ['Tipo', 'Veículo', 'Descrição', 'Valor', 'Vencimento', 'Situação'];
            const rows = pagamentos.noPrazoList.map(i => [
              i.tipo, i.veiculo_id, i.descricao || '',
              `R$ ${(i.valor || 0).toFixed(2).replace('.', ',')}`,
              i.data_vencimento ? i.data_vencimento.split('-').reverse().join('/') : '',
              i.situacao,
            ]);
            downloadCSV('pagamentos_no_prazo.csv', headers, rows);
          }}><FaDownload size={14} /> CSV</button>
        </div>
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: 'var(--table-header-bg)' }}>
                <th className={thClass}>Tipo</th>
                <th className={thClass}>Veículo</th>
                <th className={thClass}>Descrição</th>
                <th className={thClass}>Valor</th>
                <th className={thClass}>Vencimento</th>
                <th className={thClass}>Situação</th>
              </tr>
            </thead>
            <tbody>
              {pagamentos.noPrazoList.map((item, i) => (
                <tr key={`${item.tipo}-${item.id}`} className="hover:[background:var(--table-row-hover)]" style={{ color: 'var(--text-secondary)', background: i % 2 === 0 ? 'rgba(34, 197, 94, 0.04)' : 'rgba(34, 197, 94, 0.09)' }}>
                  <td className={tdClass}>
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={{
                      background: item.tipo === 'Multa' ? 'var(--danger-bg)' : 'var(--orange-bg)',
                      color: item.tipo === 'Multa' ? 'var(--danger)' : 'var(--orange-dark)',
                    }}>
                      {item.tipo}
                    </span>
                  </td>
                  <td className={tdClass} style={{ color: 'var(--success)' }}>{item.veiculo_id}</td>
                  <td className={tdClass}>{item.descricao || '-'}</td>
                  <td className={tdClass} style={{ color: 'var(--success)', fontWeight: 600 }}>
                    R$ {(item.valor || 0).toFixed(2).replace('.', ',')}
                  </td>
                  <td className={tdClass}>{item.data_vencimento ? item.data_vencimento.split('-').reverse().join('/') : '-'}</td>
                  <td className={tdClass}>
                    {item.situacao === 'Pago' ? (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>&#10003; Pago</span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={{ background: 'var(--info-bg)', color: '#0056b3' }}>&#128197; A vencer</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {graficos?.gastos?.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Evolução Mensal de Gastos</h3>
            <div className="flex gap-3 items-center">
              <select value={graficoAno} onChange={(e) => setGraficoAno(e.target.value)}
                className="px-3 py-1.5 rounded-lg border text-sm outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}>
                {Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i)).map(ano => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
              <select value={graficoVeiculo} onChange={(e) => setGraficoVeiculo(e.target.value)}
                className="px-3 py-1.5 rounded-lg border text-sm outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}>
                <option value="">Todos os veículos</option>
                {data.veiculos?.rows?.map(v => (
                  <option key={v.placa} value={v.placa}>{v.placa}{v.numero ? ` (${v.numero})` : ''}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="rounded-xl border p-4" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={graficos.gastos}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="var(--text-muted)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--text-muted)" />
                <Tooltip />
                <Bar dataKey="manutencao" name="Manutenção" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="combustivel" name="Combustível" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="multas" name="Multas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="seguros" name="Seguros" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {graficos.gastos.some(g => g.km_l != null) && (
            <>
              <h3 className="text-base font-bold mt-4 mb-3" style={{ color: 'var(--text-primary)' }}>Consumo Médio (km/L)</h3>
              <div className="rounded-xl border p-4" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={graficos.gastos.filter(g => g.km_l != null)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="var(--text-muted)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="var(--text-muted)" />
                    <Tooltip />
                    <Bar dataKey="km_l" name="km/L" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}

      {data.cnhs?.rows && (
        (() => {
          const hoje = new Date();
          const trintaDias = new Date(hoje.getTime() + 30 * 86400000);
          const expirando = data.cnhs.rows.filter(r => r.validade && r.validade >= hoje.toISOString().slice(0, 10) && r.validade <= trintaDias.toISOString().slice(0, 10));
          const vencidas = data.cnhs.rows.filter(r => r.validade && r.validade < hoje.toISOString().slice(0, 10));
          if (expirando.length === 0 && vencidas.length === 0) return null;
          return (
            <div className="flex gap-4 mb-6">
              {vencidas.length > 0 && (
                <div className="flex-1 p-4 rounded-xl border" style={{ background: 'rgba(220,53,69,0.08)', borderColor: 'var(--danger)' }}>
                  <span className="text-2xl font-bold block" style={{ color: 'var(--danger)' }}>{vencidas.length}</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>CNH vencida(s)</span>
                </div>
              )}
              {expirando.length > 0 && (
                <div className="flex-1 p-4 rounded-xl border" style={{ background: 'rgba(255,193,7,0.12)', borderColor: '#ffc107' }}>
                  <span className="text-2xl font-bold block" style={{ color: '#cc7a00' }}>{expirando.length}</span>
                  <span className="text-sm font-semibold" style={{ color: '#cc7a00' }}>CNH vence em 30 dias</span>
                </div>
              )}
            </div>
          );
        })()
      )}

      {manutencaoAlertas && (manutencaoAlertas.alertas?.length > 0 || manutencaoAlertas.proximos?.length > 0) && (
        <div className="flex gap-4 mb-6">
          {manutencaoAlertas.alertas?.length > 0 && (
            <div className="flex-1 p-4 rounded-xl border" style={{ background: 'rgba(220,53,69,0.08)', borderColor: 'var(--danger)' }}>
              <span className="text-2xl font-bold block" style={{ color: 'var(--danger)' }}>{manutencaoAlertas.alertas.length}</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>Manutenção(ões) pendente(s)</span>
              <div className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                {manutencaoAlertas.alertas.map((a, i) => (
                  <div key={i} className="flex justify-between py-0.5">
                    <span>{a.placa} — {a.tipo_descricao || a.descricao || 'Manutenção'}</span>
                    <span style={{ color: 'var(--danger)', fontWeight: 600 }}>KM {a.km_atual}/{a.km_proxima || '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {manutencaoAlertas.proximos?.length > 0 && (
            <div className="flex-1 p-4 rounded-xl border" style={{ background: 'rgba(255,193,7,0.12)', borderColor: '#ffc107' }}>
              <span className="text-2xl font-bold block" style={{ color: '#cc7a00' }}>{manutencaoAlertas.proximos.length}</span>
              <span className="text-sm font-semibold" style={{ color: '#cc7a00' }}>Próximos da manutenção</span>
              <div className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                {manutencaoAlertas.proximos.map((a, i) => (
                  <div key={i} className="flex justify-between py-0.5">
                    <span>{a.placa} — {a.tipo_descricao || a.descricao || 'Manutenção'}</span>
                    <span style={{ color: '#cc7a00', fontWeight: 600 }}>KM {a.km_atual}/{a.km_proxima || '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {chartData && chartData.some(d => d.value > 0) && (
        <div className="flex gap-6 flex-col lg:flex-row mb-6">
          <div className="flex-1 min-h-[200px] rounded-xl border p-4" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
            <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Status de Pagamentos</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                  label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : null}>
                  {chartData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 min-h-[200px] rounded-xl border p-4" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
            <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Resumo por Tabela</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tabs.filter(t => t.count > 0).slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#ff7f1e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            className="p-3 rounded-xl border text-left cursor-pointer transition-transform hover:scale-[1.02]"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}
            onClick={() => onModuleSelect?.(t.key)}
            title={`Ir para ${t.label}`}
          >
            <h3 className="text-xl font-bold" style={{ color: 'var(--orange)' }}>{t.count}</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t.label}</p>
          </button>
        ))}
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
        <div className="flex gap-0.5 overflow-x-auto p-1" style={{ background: 'var(--bg-secondary)' }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`px-4 py-2 text-sm font-semibold rounded-lg border-none cursor-pointer whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === t.key ? 'text-white' : ''
              }`}
              style={{
                background: activeTab === t.key ? 'var(--orange)' : 'transparent',
                color: activeTab === t.key ? 'white' : 'var(--text-secondary)',
              }}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
                background: activeTab === t.key ? 'rgba(255,255,255,0.2)' : 'var(--orange-bg)',
                color: activeTab === t.key ? 'white' : 'var(--orange-dark)',
              }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 p-3 border-b flex-wrap" style={{ borderColor: 'var(--border-light)' }}>
          <input
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border text-sm outline-none"
            type="text"
            placeholder="Pesquisar em toda planilha..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'var(--input-bg)',
              borderColor: 'var(--input-border)',
              color: 'var(--text-primary)',
            }}
          />
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {processedRows.length} de {activeSection?.count || 0} registro(s)
            {hasActiveFilters && (
              <button
                className="ml-2 text-xs px-2 py-1 rounded-lg border-none cursor-pointer font-medium"
                style={{ background: 'var(--orange-bg)', color: 'var(--orange-dark)' }}
                onClick={clearFilters}
              >
                Limpar filtros
              </button>
            )}
          </span>
        </div>

        {activeSection && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-sticky-header">
              <thead>
                <tr style={{ background: 'var(--table-header-bg)' }}>
                  <th className={`${thClass} w-10 text-center`} style={{ background: 'var(--table-header-bg)', position: 'sticky', top: 0, zIndex: 10 }}>#</th>
                  {displayCols.map((col) => {
                    const colFilter = columnFilters[col];
                    const isActive = !!colFilter;
                    const sortDir = colFilter?.sort;
                    return (
                      <th
                        key={col}
                        className={thClass}
                        style={{ background: 'var(--table-header-bg)', color: 'var(--text-primary)', position: 'sticky', top: 0, zIndex: 10 }}
                        onClick={(e) => openFilterMenu(col, e)}
                      >
                        <span>{formatHeader(col)}</span>
                        <span className="inline-flex items-center gap-0.5 ml-1">
                          {sortDir === 'asc' && <FaSortUp className="text-[0.6rem]" />}
                          {sortDir === 'desc' && <FaSortDown className="text-[0.6rem]" />}
                          <span className="text-[0.5rem]" style={{ color: isActive ? 'var(--orange)' : undefined }}>▼</span>
                        </span>
                        {openFilter === col && (
                          <FilterDropdown
                            items={activeSection.rows}
                            getValue={(row) => row[col]}
                            filter={colFilter || {}}
                            onFilterChange={(f) => handleFilterChange(col, f)}
                            onClose={() => { setOpenFilter(null); setFilterAnchor(null); }}
                            anchorRect={filterAnchor}
                          />
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {processedRows.length > 0 ? (
                  processedRows.map((row, i) => (
                    <tr key={i} className="hover:[background:var(--table-row-hover)]" style={{ color: 'var(--text-secondary)' }}>
                      <td className={`${tdClass} text-center`} style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      {displayCols.map((col) => (
                        <td key={col} className={tdClass}>
                          {formatCellValue(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="text-center py-12" style={{ color: 'var(--text-muted)' }} colSpan={displayCols.length + 1}>
                      Nenhum registro encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={csvConfirmOpen}
        onClose={() => { setCsvConfirmOpen(false); csvConfirmRef.current = null; }}
        onConfirm={() => { csvConfirmRef.current?.(); setCsvConfirmOpen(false); csvConfirmRef.current = null; }}
        title="Exportar planilha grande"
        message={`Exportando ${tabs.reduce((s, t) => s + (t.rows?.length || 0), 0)} linhas. Isso pode travar o navegador. Deseja continuar?`}
        danger
      />
    </div>
  );
}

