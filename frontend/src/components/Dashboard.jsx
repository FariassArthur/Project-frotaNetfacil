import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { fetchList } from '../api/client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatHeader, FilterDropdown } from '../utils/tableUtils.jsx';

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

export default function Dashboard({ token }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(null);
  const [search, setSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [openFilter, setOpenFilter] = useState(null);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [pagamentos, setPagamentos] = useState(null);
  const [showPagamentoModal, setShowPagamentoModal] = useState(null); // 'atrasados' | 'noPrazo' | null
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
    fetchList('/api/dashboard/pagamentos', token).then((r) => {
      if (r && !r.error) setPagamentos(r);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setColumnFilters({});
    setOpenFilter(null);
    setSearch('');
  }, [activeTab]);

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

    // Column-level value filters
    const activeFilters = Object.entries(columnFilters).filter(([, f]) => f.hidden && f.hidden.size > 0);
    if (activeFilters.length > 0) {
      rows = rows.filter((row) =>
        activeFilters.every(([col, f]) => {
          const v = String(row[col] ?? '');
          return !f.hidden.has(v);
        })
      );
    }

    // Global search
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        displayCols.some((col) => String(row[col] ?? '').toLowerCase().includes(q))
      );
    }

    // Sorting
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
  }, [activeSection, columnFilters, search, displayCols, dateCols]);

  const hasActiveFilters = Object.keys(columnFilters).length > 0 || search;

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    for (const tab of tabs) {
      const rows = sanitizeRows(tab.rows);
      const ws = XLSX.utils.json_to_sheet(rows);
      const colWidths = (tab.columns || []).map((c) => {
        const maxLen = Math.max(c.length, ...rows.map((r) => String(r[c] ?? '').length));
        return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
      });
      ws['!cols'] = colWidths;
      XLSX.utils.book_append_sheet(wb, ws, tab.label || tab.key);
    }
    XLSX.writeFile(wb, 'gestao_frota_completo.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let first = true;
    for (const tab of tabs) {
      const rows = sanitizeRows(tab.rows);
      const cols = tab.columns.filter((c) => !SENSITIVE_PREFIXES.some((p) => c === p || c.startsWith(p)));
      const headers = cols.map(formatHeader);
      const body = rows.map((r) => cols.map((c) => formatCellValue(r[c])));
      if (!first) doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(255, 127, 30);
      doc.text(tab.label || tab.key, 14, 18);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.text(`Total: ${tab.count} registro(s)`, 14, 23);
      doc.autoTable({
        head: [headers],
        body,
        startY: 27,
        styles: { fontSize: 6.5, cellPadding: 1.2 },
        headStyles: { fillColor: [255, 127, 30], fontSize: 7, halign: 'center' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 30, left: 10, right: 10 },
        tableWidth: 'auto',
      });
      first = false;
    }
    doc.save('gestao_frota_completo.pdf');
  };

  const clearFilters = () => {
    setColumnFilters({});
    setSearch('');
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header"><h2>Dashboard</h2></div>
        <div className="loading-spinner">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard — Planilha Geral</h2>
        <div className="dashboard-export-buttons">
          <button className="btn btn-primary" onClick={exportExcel}>⬇ Excel (.xlsx)</button>
          <button className="btn btn-primary" onClick={exportPDF}>⬇ PDF</button>
        </div>
      </div>

      {error && <div className="module-error">{error}</div>}

      {pagamentos && (
        <div className="pagamento-stats">
          <button className="pagamento-card pagamento-card-verde" onClick={() => setShowPagamentoModal('noPrazo')}>
            <span className="pagamento-card-num">{pagamentos.noPrazo.total}</span>
            <span className="pagamento-card-label">No prazo</span>
          </button>
          <button className="pagamento-card pagamento-card-vermelho" onClick={() => setShowPagamentoModal('atrasados')}>
            <span className="pagamento-card-num">{pagamentos.emAtraso.total}</span>
            <span className="pagamento-card-label">Em atraso</span>
          </button>
        </div>
      )}

      {showPagamentoModal === 'atrasados' && pagamentos?.atrasados?.length > 0 && (
        <div className="atrasados-overlay" onClick={() => setShowPagamentoModal(null)}>
          <div className="atrasados-modal" onClick={(e) => e.stopPropagation()}>
            <div className="atrasados-header">
              <h3>Pagamentos em Atraso</h3>
              <div>
                <button className="btn btn-primary btn-sm" onClick={() => {
                  const headers = ['Tipo', 'Veículo', 'Descrição', 'Valor', 'Vencimento', 'Dias Atraso'];
                  const rows = pagamentos.atrasados.map(i => [
                    i.tipo,
                    i.veiculo_id,
                    i.descricao || '',
                    `R$ ${(i.valor || 0).toFixed(2).replace('.', ',')}`,
                    i.data_vencimento ? i.data_vencimento.split('-').reverse().join('/') : '',
                    `${i.dias_atraso} dia(s)`,
                  ]);
                  downloadCSV('pagamentos_em_atraso.csv', headers, rows);
                }}>⬇ CSV</button>
                <button className="atrasados-close" onClick={() => setShowPagamentoModal(null)}>✕</button>
              </div>
            </div>
            <div className="atrasados-table-wrapper">
              <table className="atrasados-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Veículo</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Vencimento</th>
                    <th>Dias</th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentos.atrasados.map((item, i) => (
                    <tr key={`${item.tipo}-${item.id}`}>
                      <td><span className={`atrasado-badge ${item.tipo === 'Multa' ? 'badge-multa' : 'badge-documento'}`}>{item.tipo}</span></td>
                      <td>{item.veiculo_id}</td>
                      <td>{item.descricao || '-'}</td>
                      <td className="gastos-valor">
                        R$ {(item.valor || 0).toFixed(2).replace('.', ',')}
                      </td>
                      <td>{item.data_vencimento ? item.data_vencimento.split('-').reverse().join('/') : '-'}</td>
                      <td className="atrasado-dias">{item.dias_atraso} dia(s)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showPagamentoModal === 'noPrazo' && pagamentos?.noPrazoList?.length > 0 && (
        <div className="atrasados-overlay" onClick={() => setShowPagamentoModal(null)}>
          <div className="atrasados-modal" onClick={(e) => e.stopPropagation()}>
            <div className="atrasados-header">
              <h3>Pagamentos em Dia</h3>
              <div>
                <button className="btn btn-primary btn-sm" onClick={() => {
                  const headers = ['Tipo', 'Veículo', 'Descrição', 'Valor', 'Vencimento', 'Situação'];
                  const rows = pagamentos.noPrazoList.map(i => [
                    i.tipo,
                    i.veiculo_id,
                    i.descricao || '',
                    `R$ ${(i.valor || 0).toFixed(2).replace('.', ',')}`,
                    i.data_vencimento ? i.data_vencimento.split('-').reverse().join('/') : '',
                    i.situacao,
                  ]);
                  downloadCSV('pagamentos_no_prazo.csv', headers, rows);
                }}>⬇ CSV</button>
                <button className="atrasados-close" onClick={() => setShowPagamentoModal(null)}>✕</button>
              </div>
            </div>
            <div className="atrasados-table-wrapper">
              <table className="atrasados-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Veículo</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Vencimento</th>
                    <th>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentos.noPrazoList.map((item, i) => (
                    <tr key={`${item.tipo}-${item.id}`}>
                      <td><span className={`atrasado-badge ${item.tipo === 'Multa' ? 'badge-multa' : 'badge-documento'}`}>{item.tipo}</span></td>
                      <td>{item.veiculo_id}</td>
                      <td>{item.descricao || '-'}</td>
                      <td className="gastos-valor">
                        R$ {(item.valor || 0).toFixed(2).replace('.', ',')}
                      </td>
                      <td>{item.data_vencimento ? item.data_vencimento.split('-').reverse().join('/') : '-'}</td>
                      <td className={item.situacao === 'Pago' ? 'atrasado-dias' : ''}>
                        {item.situacao === 'Pago' ? '✅ Pago' : '📅 A vencer'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="stats-grid">
        {tabs.map((t) => (
          <div key={t.key} className="stat-card">
            <h3>{t.count}</h3>
            <p>{t.label}</p>
          </div>
        ))}
      </div>

      <div className="spreadsheet-container">
        <div className="sheet-tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`sheet-tab${activeTab === t.key ? ' active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
              <span className="sheet-tab-count">{t.count}</span>
            </button>
          ))}
        </div>

        <div className="sheet-toolbar">
          <input
            className="sheet-search"
            type="text"
            placeholder="Pesquisar em toda planilha..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="sheet-info">
            {processedRows.length} de {activeSection?.count || 0} registro(s)
            {hasActiveFilters && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                Limpar filtros
              </button>
            )}
          </span>
        </div>

        {activeSection && (
          <div className="sheet-table-wrapper">
            <table className="sheet-table">
              <thead>
                <tr>
                  <th className="row-num">#</th>
                  {displayCols.map((col) => {
                    const colFilter = columnFilters[col];
                    const isActive = !!colFilter;
                    const sortDir = colFilter?.sort;
                    return (
                      <th
                        key={col}
                        className={`col-header${isActive ? ' col-filter-active' : ''}`}
                        onClick={(e) => openFilterMenu(col, e)}
                      >
                        <span className="col-header-text">{formatHeader(col)}</span>
                        <span className="col-header-icons">
                          {sortDir === 'asc' && <span className="sort-indicator">⬆</span>}
                          {sortDir === 'desc' && <span className="sort-indicator">⬇</span>}
                          <span className={`filter-icon${isActive ? ' active' : ''}`}>▼</span>
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
                {processedRows.length === 0 ? (
                  <tr><td colSpan={displayCols.length + 1} className="sheet-empty">Nenhum registro encontrado</td></tr>
                ) : processedRows.map((row, i) => (
                  <tr key={i}>
                    <td className="row-num">{i + 1}</td>
                    {displayCols.map((col) => (
                      <td key={col}>{formatCellValue(row[col])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
