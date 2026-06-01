import React, { useState, useEffect, useMemo } from 'react';
import { fetchList } from '../api/client';
import { FaDownload, FaTruck } from 'react-icons/fa';
import Skeleton from './Skeleton';

function formatMoney(v) {
  return `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function downloadCSV(rows) {
  const bom = '\uFEFF';
  const headers = ['Placa', 'Modelo', 'Manutenção', 'Combustível', 'Multas', 'Seguro', 'Higienização', 'Ordens Serviço', 'Total Geral'];
  const esc = (v) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const data = rows.map(r => [
    r.placa, r.fipe_modelo || '',
    formatMoney(r.total_manutencao), formatMoney(r.total_combustivel),
    formatMoney(r.total_multas), formatMoney(r.total_seguro),
    formatMoney(r.total_higienizacao), formatMoney(r.total_os), formatMoney(r.total_geral),
  ]);
  const blob = new Blob([bom + [headers.join(','), ...data.map(r => r.map(esc).join(','))].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'relatorio_custos.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function RelatorioCustos({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('total_geral');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    setLoading(true);
    fetchList('/api/dashboard/relatorio-custos', token)
      .then(r => setData(Array.isArray(r) ? r : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const va = Number(a[sortKey] || 0);
      const vb = Number(b[sortKey] || 0);
      return sortDir === 'asc' ? va - vb : vb - va;
    });
  }, [data, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const totalGeral = useMemo(() => data.reduce((s, r) => s + Number(r.total_geral || 0), 0), [data]);

  const thClass = 'px-3.5 py-3 text-left text-sm font-bold border-b whitespace-nowrap cursor-pointer select-none';
  const tdClass = 'px-3.5 py-3 text-sm border-b';

  if (loading) return <div className="p-6"><Skeleton type="card" rows={4} /></div>;

  return (
    <div className="p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Relatório de Custos por Veículo</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold" style={{ color: 'var(--orange)' }}>Total Geral: {formatMoney(totalGeral)}</span>
          <button onClick={() => downloadCSV(data)}
            className="px-4 py-2 rounded-[12px] font-semibold text-sm text-white border-none cursor-pointer shadow-lg inline-flex items-center gap-1.5"
            style={{ background: 'var(--orange)', boxShadow: '0 8px 20px rgba(255, 125, 40, 0.2)' }}>
            <FaDownload size={14} /> CSV
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Nenhum veículo encontrado.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-light)' }}>
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: 'var(--table-header-bg)' }}>
                {[
                  { key: 'placa', label: 'Placa' },
                  { key: 'fipe_modelo', label: 'Modelo' },
                  { key: 'total_manutencao', label: 'Manutenção' },
                  { key: 'total_combustivel', label: 'Combustível' },
                  { key: 'total_multas', label: 'Multas' },
                  { key: 'total_seguro', label: 'Seguro' },
                  { key: 'total_higienizacao', label: 'Higienização' },
                  { key: 'total_os', label: 'OS (M.O.+Peças)' },
                  { key: 'total_viagens', label: 'Viagens' },
                  { key: 'total_geral', label: 'Total' },
                ].map(col => (
                  <th key={col.key} className={thClass} style={{ background: 'var(--table-header-bg)' }}
                    onClick={() => toggleSort(col.key)}>
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && <span style={{ color: 'var(--orange)' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr key={row.placa} className="hover:[background:var(--table-row-hover)]" style={{ color: 'var(--text-secondary)' }}>
                  <td className={tdClass} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    <span className="inline-flex items-center gap-1.5"><FaTruck size={12} style={{ color: 'var(--orange)' }} /> {row.placa}</span>
                  </td>
                  <td className={tdClass}>{row.fipe_modelo || '-'}</td>
                  <td className={tdClass}>{formatMoney(row.total_manutencao)}</td>
                  <td className={tdClass}>{formatMoney(row.total_combustivel)}</td>
                  <td className={tdClass} style={{ color: Number(row.total_multas) > 0 ? 'var(--danger)' : undefined }}>{formatMoney(row.total_multas)}</td>
                  <td className={tdClass}>{formatMoney(row.total_seguro)}</td>
                  <td className={tdClass}>{formatMoney(row.total_higienizacao)}</td>
                  <td className={tdClass}>{formatMoney(row.total_os)}</td>
                  <td className={tdClass}>{row.total_viagens || 0}</td>
                  <td className={tdClass} style={{ fontWeight: 700, color: 'var(--orange)' }}>{formatMoney(row.total_geral)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
