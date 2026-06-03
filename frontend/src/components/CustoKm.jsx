import React, { useState, useEffect } from 'react';
import { FaTachometerAlt } from 'react-icons/fa';
import { fetchList } from '../api/client';
import Skeleton from './Skeleton';

export default function CustoKm({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchList('/api/dashboard/custo-km', token)
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(e => { setError(e.message || 'Erro ao carregar'); setLoading(false); });
  }, []);

  if (loading) return <div className="p-6"><Skeleton type="card" rows={4} /></div>;
  if (error) return <div className="p-6"><div className="text-center py-3 px-4 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}><p className="text-sm font-semibold" style={{ color: '#dc2626' }}>{error}</p></div></div>;

  const totalGeral = data.reduce((s, r) => s + r.total_geral, 0);
  const mediaCustoKm = data.length > 0 ? data.reduce((s, r) => s + r.custo_por_km, 0) / data.length : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <FaTachometerAlt style={{ color: 'var(--orange)' }} /> Custo por KM Rodado
      </h1>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 p-4 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Geral</span>
          <span className="text-2xl font-bold block" style={{ color: 'var(--orange)' }}>R$ {totalGeral.toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="flex-1 p-4 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Média R$/km</span>
          <span className="text-2xl font-bold block" style={{ color: 'var(--orange)' }}>R$ {mediaCustoKm.toFixed(4).replace('.', ',')}</span>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 700 }}>
            <thead>
              <tr style={{ background: 'var(--table-header-bg)' }}>
                <th className="px-3.5 py-3 text-left text-sm font-bold border-b" style={{ borderColor: 'var(--border-light)' }}>Placa</th>
                <th className="px-3.5 py-3 text-left text-sm font-bold border-b" style={{ borderColor: 'var(--border-light)' }}>Modelo</th>
                <th className="px-3.5 py-3 text-right text-sm font-bold border-b" style={{ borderColor: 'var(--border-light)' }}>KM</th>
                <th className="px-3.5 py-3 text-right text-sm font-bold border-b" style={{ borderColor: 'var(--border-light)' }}>Manutenção</th>
                <th className="px-3.5 py-3 text-right text-sm font-bold border-b" style={{ borderColor: 'var(--border-light)' }}>Combustível</th>
                <th className="px-3.5 py-3 text-right text-sm font-bold border-b" style={{ borderColor: 'var(--border-light)' }}>Multas</th>
                <th className="px-3.5 py-3 text-right text-sm font-bold border-b" style={{ borderColor: 'var(--border-light)' }}>Seguro</th>
                <th className="px-3.5 py-3 text-right text-sm font-bold border-b" style={{ borderColor: 'var(--border-light)' }}>Higienização</th>
                <th className="px-3.5 py-3 text-right text-sm font-bold border-b" style={{ borderColor: 'var(--border-light)' }}>OS (M.O.+Peças)</th>
                <th className="px-3.5 py-3 text-right text-sm font-bold border-b" style={{ borderColor: 'var(--border-light)' }}>Total</th>
                <th className="px-3.5 py-3 text-right text-sm font-bold border-b" style={{ borderColor: 'var(--border-light)' }}>R$/km</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td className="px-3.5 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }} colSpan={11}>Nenhum veículo encontrado.</td></tr>
              ) : data.map(r => (
                <tr key={r.placa} className="hover:[background:var(--table-row-hover)]" style={{ color: 'var(--text-secondary)' }}>
                  <td className="px-3.5 py-3 text-sm border-b font-semibold" style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}>{r.placa}</td>
                  <td className="px-3.5 py-3 text-sm border-b" style={{ borderColor: 'var(--border-light)' }}>{r.modelo || '-'}</td>
                  <td className="px-3.5 py-3 text-sm border-b text-right" style={{ borderColor: 'var(--border-light)' }}>{r.km_atual?.toLocaleString()}</td>
                  <td className="px-3.5 py-3 text-sm border-b text-right" style={{ borderColor: 'var(--border-light)' }}>R$ {r.total_manutencao.toFixed(2).replace('.',',')}</td>
                  <td className="px-3.5 py-3 text-sm border-b text-right" style={{ borderColor: 'var(--border-light)' }}>R$ {r.total_combustivel.toFixed(2).replace('.',',')}</td>
                  <td className="px-3.5 py-3 text-sm border-b text-right" style={{ borderColor: 'var(--border-light)' }}>R$ {r.total_multas.toFixed(2).replace('.',',')}</td>
                  <td className="px-3.5 py-3 text-sm border-b text-right" style={{ borderColor: 'var(--border-light)' }}>R$ {r.total_seguro.toFixed(2).replace('.',',')}</td>
                  <td className="px-3.5 py-3 text-sm border-b text-right" style={{ borderColor: 'var(--border-light)' }}>R$ {r.total_higienizacao.toFixed(2).replace('.',',')}</td>
                  <td className="px-3.5 py-3 text-sm border-b text-right" style={{ borderColor: 'var(--border-light)' }}>R$ {r.total_os.toFixed(2).replace('.',',')}</td>
                  <td className="px-3.5 py-3 text-sm border-b text-right font-bold" style={{ borderColor: 'var(--border-light)', color: 'var(--orange)' }}>R$ {r.total_geral.toFixed(2).replace('.',',')}</td>
                  <td className="px-3.5 py-3 text-sm border-b text-right font-bold" style={{ borderColor: 'var(--border-light)' }}>
                    <span className="px-2 py-0.5 rounded text-xs" style={{
                      background: r.custo_por_km < 1 ? 'var(--success-bg)' : r.custo_por_km < 2 ? 'var(--warning-bg)' : 'var(--danger-bg)',
                      color: r.custo_por_km < 1 ? 'var(--success)' : r.custo_por_km < 2 ? '#cc7a00' : 'var(--danger)',
                    }}>
                      R$ {(r.custo_por_km).toFixed(4).replace('.', ',')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
