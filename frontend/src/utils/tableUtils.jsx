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
    <div
      ref={dropdownRef}
      onClick={(e) => e.stopPropagation()}
      style={style}
      className="fixed z-50 min-w-[220px] max-w-[300px] bg-[var(--card-bg)] border border-[var(--border-light)] rounded-xl shadow-lg py-1"
    >
      <fieldset className="border-0 p-0 m-0">
        <legend className="sr-only">Opções de filtro</legend>
        <div className="px-3 py-2 border-b border-[var(--border-light)]">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Ordenar</label>
          <div className="flex gap-1">
            <button
              className={`flex-1 px-2 py-1 text-xs rounded-md border transition-colors ${
                filter.sort === 'asc' ? 'bg-[var(--orange)] text-white border-[var(--orange)]' : 'border-[var(--border-light)] hover:bg-[var(--orange-bg)]'
              }`}
              style={{ color: filter.sort === 'asc' ? 'white' : 'var(--text-secondary)' }}
              onClick={() => onFilterChange({ ...filter, sort: filter.sort === 'asc' ? null : 'asc' })}
              aria-pressed={filter.sort === 'asc'}
            >
              <span aria-hidden="true">&#9650;</span> A-Z
            </button>
            <button
              className={`flex-1 px-2 py-1 text-xs rounded-md border transition-colors ${
                filter.sort === 'desc' ? 'bg-[var(--orange)] text-white border-[var(--orange)]' : 'border-[var(--border-light)] hover:bg-[var(--orange-bg)]'
              }`}
              style={{ color: filter.sort === 'desc' ? 'white' : 'var(--text-secondary)' }}
              onClick={() => onFilterChange({ ...filter, sort: filter.sort === 'desc' ? null : 'desc' })}
              aria-pressed={filter.sort === 'desc'}
            >
              <span aria-hidden="true">&#9660;</span> Z-A
            </button>
          </div>
        </div>
        <div className="px-3 py-2">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Filtrar valores</label>
          <input
            className="w-full px-2 py-1.5 text-xs rounded-md border outline-none mb-1.5"
            placeholder="Buscar..."
            value={valueSearch}
            onChange={(e) => setValueSearch(e.target.value)}
            style={{
              background: 'var(--input-bg)',
              borderColor: 'var(--input-border)',
              color: 'var(--text-primary)',
            }}
          />
          <div className="flex gap-2 mb-1.5">
            <button
              className="text-xs border-none bg-transparent cursor-pointer p-0 font-medium"
              style={{ color: 'var(--orange)' }}
              onClick={showAll}
            >Selecionar todos</button>
            <button
              className="text-xs border-none bg-transparent cursor-pointer p-0 font-medium"
              style={{ color: 'var(--orange)' }}
              onClick={hideAll}
            >Limpar</button>
          </div>
          <div className="max-h-[180px] overflow-y-auto space-y-0.5">
            {filteredValues.length > 0 ? (
              filteredValues.map((v) => (
                <label
                  key={v}
                  className="flex items-center gap-1.5 px-1 py-0.5 rounded cursor-pointer text-xs hover:bg-[var(--orange-bg)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <input
                    type="checkbox"
                    className="accent-[var(--orange)]"
                    checked={!hidden.has(v)}
                    onChange={() => toggleValue(v)}
                  />
                  <span className="truncate">{v || '(vazio)'}</span>
                </label>
              ))
            ) : (
              <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Nenhum valor encontrado</p>
            )}
          </div>
        </div>
      </fieldset>
    </div>
  );
}
