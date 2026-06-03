import React, { useState, useEffect } from 'react';
import { FaGasPump } from 'react-icons/fa';
import { fetchList } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Skeleton from './Skeleton';

export default function ConsumoVeiculos({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchList('/api/dashboard/consumo', token)
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(e => { setError(e.message || 'Erro ao carregar'); setLoading(false); });
  }, []);

  if (loading) return <div className="p-6"><Skeleton type="card" rows={4} /></div>;
  if (error) return <div className="p-6"><div className="text-center py-3 px-4 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}><p className="text-sm font-semibold" style={{ color: '#dc2626' }}>{error}</p></div></div>;

  const chartColors = ['#ff7f1e', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6'];

  const chartData = data.filter(d => d.km_l != null).slice(0, 15);
  const totalLitros = data.reduce((s, r) => s + r.total_litros, 0);
  const totalGasto = data.reduce((s, r) => s + r.total_gasto, 0);
  const mediaKm = chartData.length > 0 ? chartData.reduce((s, r) => s + r.km_l, 0) / chartData.length : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <FaGasPump style={{ color: 'var(--orange)' }} /> Consumo de Combustível
      </h1>

      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="flex-1 min-w-[140px] p-4 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Litros</span>
          <span className="text-2xl font-bold block" style={{ color: 'var(--orange)' }}>{totalLitros.toFixed(1)} L</span>
        </div>
        <div className="flex-1 min-w-[140px] p-4 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Gasto</span>
          <span className="text-2xl font-bold block" style={{ color: 'var(--orange)' }}>R$ {totalGasto.toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="flex-1 min-w-[140px] p-4 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Média km/L</span>
          <span className="text-2xl font-bold block" style={{ color: 'var(--orange)' }}>{mediaKm.toFixed(2)}</span>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="rounded-xl border p-4 mb-6" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Comparativo km/L por Veículo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="placa" tick={{ fontSize: 11 }} stroke="var(--text-muted)" angle={-45} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--text-muted)" label={{ value: 'km/L', angle: -90, position: 'insideLeft', style: { fill: 'var(--text-muted)' } }} />
              <Tooltip formatter={(v) => `${v} km/L`} />
              <Bar dataKey="km_l" name="km/L" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 600 }}>
            <thead>
              <tr style={{ background: 'var(--table-header-bg)' }}>
                <th className="px-3.5 py-3 text-left text-sm font-bold border-b" style={{ borderColor: 'var(--border-light)' }}>Placa</th>
                <th className="px-3.5 py-3 text-left text-sm font-bold border-b" style={{ borderColor: 'var(--border-light)' }}>Modelo</th>
                <th className="px-3.5 py-3 text-right text-sm font-bold border-b" style={{ borderColor: 'var(--border-light)' }}>Abast.</th>
                <th className="px-3.5 py-3 text-right text-sm font-bold border-b" style={{ borderColor: 'var(--border-light)' }}>Total (L)</th>
                <th className="px-3.5 py-3 text-right text-sm font-bold border-b" style={{ borderColor: 'var(--border-light)' }}>Gasto</th>
                <th className="px-3.5 py-3 text-right text-sm font-bold border-b" style={{ borderColor: 'var(--border-light)' }}>km/L</th>
                <th className="px-3.5 py-3 text-right text-sm font-bold border-b" style={{ borderColor: 'var(--border-light)' }}>R$/L</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td className="px-3.5 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }} colSpan={7}>Nenhum veículo encontrado.</td></tr>
              ) : data.map(r => (
                <tr key={r.placa} className="hover:[background:var(--table-row-hover)]" style={{ color: 'var(--text-secondary)' }}>
                  <td className="px-3.5 py-3 text-sm border-b font-semibold" style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}>{r.placa}</td>
                  <td className="px-3.5 py-3 text-sm border-b" style={{ borderColor: 'var(--border-light)' }}>{r.modelo || '-'}</td>
                  <td className="px-3.5 py-3 text-sm border-b text-right" style={{ borderColor: 'var(--border-light)' }}>{r.total_abastecimentos}</td>
                  <td className="px-3.5 py-3 text-sm border-b text-right" style={{ borderColor: 'var(--border-light)' }}>{r.total_litros}</td>
                  <td className="px-3.5 py-3 text-sm border-b text-right" style={{ borderColor: 'var(--border-light)' }}>R$ {r.total_gasto.toFixed(2).replace('.',',')}</td>
                  <td className="px-3.5 py-3 text-sm border-b text-right font-bold" style={{ borderColor: 'var(--border-light)' }}>
                    {r.km_l ? (
                      <span className="px-2 py-0.5 rounded text-xs" style={{
                        background: r.km_l >= mediaKm ? 'var(--success-bg)' : 'var(--danger-bg)',
                        color: r.km_l >= mediaKm ? 'var(--success)' : 'var(--danger)',
                      }}>{r.km_l} km/L</span>
                    ) : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td className="px-3.5 py-3 text-sm border-b text-right" style={{ borderColor: 'var(--border-light)' }}>R$ {r.custo_por_litro.toFixed(2).replace('.',',')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
