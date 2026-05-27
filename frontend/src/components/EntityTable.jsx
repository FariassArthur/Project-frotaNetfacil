import React, { useState, useMemo, useRef, useEffect } from 'react';
import { getFileUrl, getItemValue } from '../api/client';

function formatHeader(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace(/\bId\b/g, 'ID')
    .replace(/\bPdf\b/g, 'PDF')
    .replace(/\bCpf\b/g, 'CPF')
    .replace(/\bCnpj\b/g, 'CNPJ')
    .replace(/\bKm\b/g, 'KM')
    .replace(/\bCep\b/g, 'CEP')
    .replace(/\bUf\b/g, 'UF')
    .replace(/\bIpva\b/g, 'IPVA');
}

function getSortValue(val) {
  if (val === null || val === undefined) return -Infinity;
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (typeof val === 'number') return val;
  const n = Number(val);
  if (!isNaN(n)) return n;
  return String(val).toLowerCase();
}

function FilterDropdown({ field, items, filter, onFilterChange, onClose, anchorRect }) {
  const [valueSearch, setValueSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const uniqueValues = useMemo(() => {
    const set = new Set();
    for (const item of items) {
      const v = getItemValue(item, field.name);
      set.add(v != null ? String(v) : '');
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items, field]);

  const filteredValues = valueSearch
    ? uniqueValues.filter((v) => v.toLowerCase().includes(valueSearch.toLowerCase()))
    : uniqueValues;

  const hidden = filter.hidden || new Set();

  const toggleValue = (v) => {
    const next = new Set(hidden);
    if (next.has(v)) next.delete(v); else next.add(v);
    onFilterChange({ ...filter, hidden: next.size === 0 ? null : next });
  };

  const showAll = () => onFilterChange({ ...filter, hidden: null });
  const hideAll = () => onFilterChange({ ...filter, hidden: new Set(uniqueValues) });

  const style = anchorRect ? {
    position: 'fixed',
    top: anchorRect.bottom + 4,
    left: Math.min(anchorRect.left, window.innerWidth - 320),
  } : {};

  return (
    <div className="filter-dropdown" ref={dropdownRef} onClick={(e) => e.stopPropagation()} style={style}>
      <div className="filter-dropdown-section">
        <label className="filter-label">Ordenar</label>
        <div className="filter-sort-buttons">
          <button
            className={`filter-sort-btn${filter.sort === 'asc' ? ' active' : ''}`}
            onClick={() => onFilterChange({ ...filter, sort: filter.sort === 'asc' ? null : 'asc' })}
          >⬆ A-Z</button>
          <button
            className={`filter-sort-btn${filter.sort === 'desc' ? ' active' : ''}`}
            onClick={() => onFilterChange({ ...filter, sort: filter.sort === 'desc' ? null : 'desc' })}
          >⬇ Z-A</button>
        </div>
      </div>
      <div className="filter-dropdown-section">
        <label className="filter-label">Filtrar valores</label>
        <input
          className="filter-value-search"
          placeholder="Buscar..."
          value={valueSearch}
          onChange={(e) => setValueSearch(e.target.value)}
        />
        <div className="filter-value-actions">
          <button onClick={showAll}>Selecionar todos</button>
          <button onClick={hideAll}>Limpar</button>
        </div>
        <div className="filter-value-list">
          {filteredValues.map((v) => (
            <label key={v} className="filter-value-item">
              <input
                type="checkbox"
                checked={!hidden.has(v)}
                onChange={() => toggleValue(v)}
              />
              <span>{v || '(vazio)'}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EntityTable({ items, fields, onSelect, onDelete }) {
  const [columnFilters, setColumnFilters] = useState({});
  const [openFilter, setOpenFilter] = useState(null);
  const [filterAnchor, setFilterAnchor] = useState(null);

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

  const baseFields = fields.slice(0, 8);
  const extraFileFields = fields.slice(8).filter((f) => f.type === 'file');
  const displayFields = [...baseFields, ...extraFileFields];

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

  return (
    <div>
      {hasActiveFilters && (
        <div style={{ marginBottom: 8 }}>
          <button className="clear-filters-btn" onClick={() => setColumnFilters({})}>
            Limpar filtros
          </button>
        </div>
      )}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              {displayFields.map((field) => {
                const colFilter = columnFilters[field.name];
                const isActive = !!colFilter;
                const sortDir = colFilter?.sort;
                return (
                  <th
                    key={field.name}
                    className={`col-header${isActive ? ' col-filter-active' : ''}`}
                    onClick={(e) => openFilterMenu(field.name, e)}
                  >
                    <span className="col-header-text">{field.label}</span>
                    <span className="col-header-icons">
                      {sortDir === 'asc' && <span className="sort-indicator">⬆</span>}
                      {sortDir === 'desc' && <span className="sort-indicator">⬇</span>}
                      <span className={`filter-icon${isActive ? ' active' : ''}`}>▼</span>
                    </span>
                    {openFilter === field.name && (
                      <FilterDropdown
                        field={field}
                        items={items}
                        filter={colFilter || {}}
                        onFilterChange={(f) => handleFilterChange(field.name, f)}
                        onClose={() => { setOpenFilter(null); setFilterAnchor(null); }}
                        anchorRect={filterAnchor}
                      />
                    )}
                  </th>
                );
              })}
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {processedItems.length > 0 ? (
              processedItems.map((item, idx) => (
                <tr key={idx}>
                  {displayFields.map((field) => {
                    const val = getItemValue(item, field.name);
                    const fileUrl = field.type === 'file' ? getFileUrl(val) : null;
                    return (
                      <td key={field.name}>
                        {fileUrl ? (
                          <a
                            href={fileUrl}
                            className="file-link"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            📎 Visualizar
                          </a>
                        ) : (
                          String(val || '').substring(0, 30)
                        )}
                      </td>
                    );
                  })}
                  <td>
                    <button className="btn-edit" onClick={() => onSelect(item)} style={{ marginRight: 6 }}>
                      Editar
                    </button>
                    <button className="btn-delete" onClick={() => onDelete(item)}>
                      Deletar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="table-empty" colSpan={displayFields.length + 1}>
                  {hasActiveFilters ? 'Nenhum registro corresponde aos filtros' : 'Nenhum registro encontrado'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
