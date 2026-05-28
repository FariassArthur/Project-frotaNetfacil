import React, { useState, useMemo, useRef, useEffect } from 'react';

export function formatHeader(key) {
  return key
    .replace(/^id$/i, 'ID')
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

export function getSortValue(val) {
  if (val === null || val === undefined) return -Infinity;
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (typeof val === 'number') return val;
  const n = Number(val);
  if (!isNaN(n)) return n;
  return String(val).toLowerCase();
}

export function FilterDropdown({ items, getValue, filter, onFilterChange, onClose, anchorRect }) {
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
      const v = getValue(item);
      set.add(v != null ? String(v) : '');
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items, getValue]);

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
