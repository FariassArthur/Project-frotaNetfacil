import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FaPaperclip, FaSortUp, FaSortDown } from 'react-icons/fa';
import { getFileUrl, getItemValue } from '../api/client';
import { formatHeader, getSortValue, FilterDropdown } from '../utils/tableUtils.jsx';

export default function EntityTable({ items, fields, onSelect, onDelete, totalCount, page, pageSize, onPageChange, onBatchDelete }) {
  const [columnFilters, setColumnFilters] = useState({});
  const [openFilter, setOpenFilter] = useState(null);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const tableRef = useRef(null);

  useEffect(() => {
    setSelectedIds(new Set());
    setColumnFilters({});
    setOpenFilter(null);
  }, [items]);

  const openFilterMenu = (fieldName, e) => {
    if (openFilter === fieldName) {
      setOpenFilter(null);
      setFilterAnchor(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setFilterAnchor(rect);
    setOpenFilter(fieldName);
  };

  const fileFields = fields.filter((f) => f.type === 'file');
  const nonFileFields = fields.filter((f) => f.type !== 'file' && !f.tableOnly);
  const displayFields = [...nonFileFields, ...fileFields];

  const handleFilterChange = (fieldName, filter) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      const hasFilter = filter.sort || (filter.hidden && filter.hidden.size > 0);
      if (hasFilter) next[fieldName] = filter;
      else delete next[fieldName];
      return next;
    });
  };

  const processedItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    let result = items;

    const activeFilters = Object.entries(columnFilters).filter(([, f]) => f.hidden && f.hidden.size > 0);
    if (activeFilters.length > 0) {
      result = result.filter((item) =>
        activeFilters.every(([colName, f]) => {
          const v = String(getItemValue(item, colName) ?? '');
          return !f.hidden.has(v);
        })
      );
    }

    const sortEntry = Object.entries(columnFilters).find(([, f]) => f.sort);
    if (sortEntry) {
      const [sortCol, { sort: dir }] = sortEntry;
      result = [...result].sort((a, b) => {
        const va = getSortValue(getItemValue(a, sortCol));
        const vb = getSortValue(getItemValue(b, sortCol));
        if (va === -Infinity) return 1;
        if (vb === -Infinity) return -1;
        if (typeof va === 'string' && typeof vb === 'string') {
          return dir === 'desc' ? vb.localeCompare(va) : va.localeCompare(vb);
        }
        return dir === 'desc' ? vb - va : va - vb;
      });
    }

    return result;
  }, [items, columnFilters]);

  const hasActiveFilters = Object.keys(columnFilters).length > 0;

  const thClass = 'px-3.5 py-3 text-left text-sm font-bold border-b whitespace-nowrap cursor-pointer select-none';
  const tdClass = 'px-3.5 py-3 text-sm border-b';
  const btnBase = 'px-3.5 py-1.5 text-xs rounded-[6px] font-semibold text-white border-none cursor-pointer inline-flex items-center gap-1 transition-colors';

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {hasActiveFilters && (
          <button
            className="text-xs px-3 py-1.5 rounded-lg border-none cursor-pointer font-medium"
            style={{ background: 'var(--orange-bg)', color: 'var(--orange-dark)' }}
            onClick={() => setColumnFilters({})}
          >
            Limpar filtros
          </button>
        )}
        {selectedIds.size > 0 && onBatchDelete && (
          <button
            className="text-xs px-3 py-1.5 rounded-lg border-none cursor-pointer font-medium"
            style={{ background: '#dc3545', color: 'white' }}
            onClick={() => {
              if (window.confirm(`Deletar ${selectedIds.size} registro(s) selecionado(s)?`)) {
                onBatchDelete([...selectedIds]);
                setSelectedIds(new Set());
              }
            }}
          >
            Deletar {selectedIds.size} selecionado(s)
          </button>
        )}
      </div>
      <div className="overflow-x-auto" ref={tableRef}>
        <table className="w-full border-collapse rounded-xl overflow-hidden table-sticky-header" style={{ background: 'var(--card-bg)' }}>
          <thead style={{ background: 'var(--table-header-bg)' }}>
            <tr>
              {onBatchDelete && (
                <th className={thClass} style={{ background: 'var(--table-header-bg)', width: 36, position: 'sticky', top: 0, zIndex: 11 }}>
                  <input type="checkbox" className="w-4 h-4 accent-[var(--orange)] cursor-pointer"
                    checked={selectedIds.size === items.length && items.length > 0}
                    onChange={() => {
                      if (selectedIds.size === items.length) setSelectedIds(new Set());
                      else setSelectedIds(new Set(items.map((_, i) => i)));
                    }}
                  />
                </th>
              )}
              {displayFields.map((field) => {
                const colFilter = columnFilters[field.name];
                const isActive = !!colFilter;
                const sortDir = colFilter?.sort;
                return (
                  <th
                    key={field.name}
                    className={thClass}
                    style={{ background: 'var(--table-header-bg)', color: 'var(--text-primary)', position: 'sticky', top: 0, zIndex: 11 }}
                    onClick={(e) => openFilterMenu(field.name, e)}
                  >
                    <span>{field.label}</span>
                    <span className="inline-flex items-center gap-0.5 ml-1" style={{ transition: 'opacity 0.15s' }}>
                      {sortDir === 'asc' && <FaSortUp className="text-[0.6rem]" style={{ opacity: sortDir ? 1 : 0.3 }} />}
                      {sortDir === 'desc' && <FaSortDown className="text-[0.6rem]" style={{ opacity: sortDir ? 1 : 0.3 }} />}
                      <span className="text-[0.5rem]" style={{ color: isActive ? 'var(--orange)' : undefined }}>▼</span>
                    </span>
                    {openFilter === field.name && (
                      <FilterDropdown
                        items={items}
                        getValue={(item) => getItemValue(item, field.name)}
                        filter={colFilter || {}}
                        onFilterChange={(f) => handleFilterChange(field.name, f)}
                        onClose={() => { setOpenFilter(null); setFilterAnchor(null); }}
                        anchorRect={filterAnchor}
                      />
                    )}
                  </th>
                );
              })}
              <th className={thClass} style={{ background: 'var(--table-header-bg)', color: 'var(--text-primary)', position: 'sticky', top: 0, zIndex: 11 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
              {processedItems.length > 0 ? (
                processedItems.map((item, idx) => (
                  <tr key={idx} className="hover:[background:var(--table-row-hover)]" style={{ color: 'var(--text-secondary)' }}>
                    {onBatchDelete && (
                      <td className={tdClass} style={{ width: 36 }}>
                        <input type="checkbox" className="w-4 h-4 accent-[var(--orange)] cursor-pointer"
                          checked={selectedIds.has(idx)}
                          onChange={() => {
                            setSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(idx)) next.delete(idx); else next.add(idx);
                              return next;
                            });
                          }}
                        />
                      </td>
                    )}
                    {displayFields.map((field) => {
                    const val = getItemValue(item, field.name);
                    const fileUrl = field.type === 'file' ? getFileUrl(val) : null;
                    return (
                      <td key={field.name} className={tdClass} style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {fileUrl ? (
                          <a
                            href={fileUrl}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-semibold no-underline transition-colors"
                            style={{
                              background: 'var(--orange-bg)',
                              color: 'var(--orange-dark)',
                              border: '1px solid var(--border-light)',
                            }}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FaPaperclip size={12} className="mr-1" /> Visualizar
                          </a>
                        ) : (
                          <span title={String(val || '')}>{String(val || '').substring(0, 30)}</span>
                        )}
                      </td>
                    );
                  })}
                  <td className={`${tdClass} whitespace-nowrap flex gap-1.5 items-center`}>
                    <button
                      className={`${btnBase}`}
                      style={{ background: 'var(--orange)' }}
                      onClick={() => onSelect(item)}
                    >
                      Editar
                    </button>
                    <button
                      className={`${btnBase}`}
                      style={{ background: 'var(--danger)' }}
                      onClick={() => onDelete(item)}
                    >
                      Deletar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="text-center py-8" style={{ color: 'var(--text-muted)' }} colSpan={displayFields.length + 1 + (onBatchDelete ? 1 : 0)}>
                  {hasActiveFilters ? 'Nenhum registro corresponde aos filtros' : 'Nenhum registro encontrado'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalCount > 0 && onPageChange && (
        <div className="flex items-center gap-4 mt-3 justify-end">
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {((page || 1) - 1) * (pageSize || 200) + 1}-
            {Math.min((page || 1) * (pageSize || 200), totalCount)} de {totalCount}
          </span>
          <button
            className="px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--border-light)',
              color: 'var(--text-secondary)',
            }}
            disabled={(page || 1) <= 1}
            onClick={() => onPageChange((page || 1) - 1)}
          >
            &lsaquo; Anterior
          </button>
          <button
            className="px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--border-light)',
              color: 'var(--text-secondary)',
            }}
            disabled={(page || 1) * (pageSize || 200) >= totalCount}
            onClick={() => onPageChange((page || 1) + 1)}
          >
            Pr&oacute;ximo &rsaquo;
          </button>
        </div>
      )}
    </div>
  );
}
