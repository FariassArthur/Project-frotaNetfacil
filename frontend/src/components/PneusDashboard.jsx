import React, { useState, useEffect } from 'react';
import { FaTachometerAlt, FaDollarSign, FaWarehouse, FaCheckCircle } from 'react-icons/fa';
import { fetchList } from '../api/client';
import Skeleton from './Skeleton';

export default function PneusDashboard({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchList('/api/dashboard/pneus', token)
      .then(d => setData(Array.isArray(d) ? d : []))
      .catch(e => console.error('Erro ao carregar pneus:', e))
      .finally(() => setLoading(false));
  }, []);

  const totalGasto = data.reduce((s, r) => s + r.total_gasto, 0);
  const totalPneus = data.reduce((s, r) => s + r.total_pneus, 0);
  const totalInstalados = data.reduce((s, r) => s + r.instalados, 0);

  if (loading) {
    return <div className="p-6"><Skeleton type="card" rows={4} /></div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <FaTachometerAlt style={{ color: 'var(--orange)' }} /> Dashboard de Pneus
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl border flex flex-col gap-1" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total de Pneus</span>
          <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalPneus}</span>
        </div>
        <div className="p-4 rounded-xl border flex flex-col gap-1" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Instalados</span>
          <span className="text-2xl font-bold" style={{ color: 'var(--success)' }}>{totalInstalados}</span>
        </div>
        <div className="p-4 rounded-xl border flex flex-col gap-1" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Gasto Total</span>
          <span className="text-2xl font-bold" style={{ color: 'var(--danger)' }}>R$ {totalGasto.toFixed(2).replace('.',',')}</span>
        </div>
      </div>

      {data.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Nenhum pneu registrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-light)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--orange-bg)' }}>
                <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--text-primary)' }}>Placa</th>
                <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--text-primary)' }}>Modelo</th>
                <th className="text-center px-4 py-2.5 font-semibold" style={{ color: 'var(--text-primary)' }}>Total</th>
                <th className="text-center px-4 py-2.5 font-semibold" style={{ color: 'var(--text-primary)' }}>
                  <FaCheckCircle size={12} className="inline" /> Instalados
                </th>
                <th className="text-center px-4 py-2.5 font-semibold" style={{ color: 'var(--text-primary)' }}>
                  <FaWarehouse size={12} className="inline" /> Estoque
                </th>
                <th className="text-center px-4 py-2.5 font-semibold" style={{ color: 'var(--text-primary)' }}>
                  <FaDollarSign size={12} className="inline" /> Gasto
                </th>
                <th className="text-center px-4 py-2.5 font-semibold" style={{ color: 'var(--text-primary)' }}>KM Médio</th>
              </tr>
            </thead>
            <tbody>
              {data.map(r => (
                <tr key={r.veiculo_id} className="border-t hover:opacity-80" style={{ borderColor: 'var(--border-light)' }}>
                  <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>{r.placa || r.veiculo_id}</td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>{r.fipe_modelo || '—'}</td>
                  <td className="text-center px-4 py-2.5 font-semibold" style={{ color: 'var(--text-primary)' }}>{r.total_pneus}</td>
                  <td className="text-center px-4 py-2.5" style={{ color: 'var(--success)' }}>{r.instalados || 0}</td>
                  <td className="text-center px-4 py-2.5" style={{ color: 'var(--warning)' }}>{r.em_estoque || 0}</td>
                  <td className="text-center px-4 py-2.5 font-semibold" style={{ color: 'var(--danger)' }}>
                    R$ {r.total_gasto.toFixed(2).replace('.',',')}
                  </td>
                  <td className="text-center px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {r.km_medio ? `${r.km_medio.toLocaleString(undefined, {maximumFractionDigits:0})} km` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
