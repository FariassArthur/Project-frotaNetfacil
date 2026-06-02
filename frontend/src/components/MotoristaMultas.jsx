import React, { useState, useEffect } from 'react';
import { FaUserCheck, FaDownload, FaSearch } from 'react-icons/fa';
import Skeleton from './Skeleton';

export default function MotoristaMultas({ token }) {
  const [data, setData] = useState({ motoristas: [], total_geral: 0 });
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/motorista-multas', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { setData(d || { motoristas: [], total_geral: 0 }); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const loadDetail = async (registro) => {
    try {
      const r = await fetch(`/api/motorista-multas/${registro}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDetail(await r.json());
    } catch (err) {
      console.error(err);
    }
  };

  const downloadCSV = () => {
    const bom = '\uFEFF';
    const headers = ['Motorista', 'Registro', 'Total Multas', 'Valor Total', 'Pagas', 'Pendentes', 'Valor Pendente', 'Veículos'];
    const rows = data.motoristas.map(r => [
      r.motorista_nome, r.numero_registro, r.total_multas,
      `R$ ${(r.valor_total || 0).toFixed(2).replace('.', ',')}`,
      r.pagas, r.pendentes,
      `R$ ${(r.valor_pendente || 0).toFixed(2).replace('.', ',')}`,
      r.veiculos || '',
    ]);
    const blob = new Blob([bom + [headers.join(','), ...rows.map(r => r.map(v => String(v).includes(',') ? `"${v}"` : v).join(','))].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'multas_por_motorista.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-6"><Skeleton type="card" rows={4} /></div>;

  const thClass = 'px-3.5 py-3 text-left text-sm font-bold border-b';
  const tdClass = 'px-3.5 py-3 text-sm border-b';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <FaUserCheck style={{ color: 'var(--orange)' }} /> Multas por Motorista
      </h1>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4">
          <div className="px-4 py-2 rounded-lg border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Motoristas</span>
            <span className="text-lg font-bold ml-2" style={{ color: 'var(--orange)' }}>{data.motoristas.length}</span>
          </div>
          <div className="px-4 py-2 rounded-lg border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Multas</span>
            <span className="text-lg font-bold ml-2" style={{ color: 'var(--danger)' }}>R$ {data.total_geral.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
        <button onClick={downloadCSV}
          className="px-4 py-2 rounded-[12px] font-semibold text-sm text-white border-none cursor-pointer shadow-lg inline-flex items-center gap-1.5"
          style={{ background: 'var(--orange)' }}>
          <FaDownload size={14} /> CSV
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: 'var(--table-header-bg)' }}>
                <th className={thClass}>Motorista</th>
                <th className={thClass}>Registro</th>
                <th className={`${thClass} text-right`}>Multas</th>
                <th className={`${thClass} text-right`}>Valor Total</th>
                <th className={`${thClass} text-right`}>Pagas</th>
                <th className={`${thClass} text-right`}>Pendentes</th>
                <th className={`${thClass} text-right`}>Valor Pendente</th>
                <th className={thClass}>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {data.motoristas.map(m => (
                <tr key={m.numero_registro} className="hover:[background:var(--table-row-hover)]" style={{ color: 'var(--text-secondary)' }}>
                  <td className={tdClass} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{m.motorista_nome}</td>
                  <td className={tdClass} style={{ color: 'var(--text-muted)' }}>{m.numero_registro}</td>
                  <td className={`${tdClass} text-right font-semibold`}>{m.total_multas}</td>
                  <td className={`${tdClass} text-right`}>R$ {(m.valor_total || 0).toFixed(2).replace('.',',')}</td>
                  <td className={`${tdClass} text-right`} style={{ color: 'var(--success)' }}>{m.pagas}</td>
                  <td className={`${tdClass} text-right`} style={{ color: 'var(--danger)' }}>{m.pendentes}</td>
                  <td className={`${tdClass} text-right font-bold`} style={{ color: 'var(--danger)' }}>R$ {(m.valor_pendente || 0).toFixed(2).replace('.',',')}</td>
                  <td className={tdClass}>
                    <button onClick={() => loadDetail(m.numero_registro)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer inline-flex items-center gap-1"
                      style={{ background: 'var(--orange-bg)', color: 'var(--orange-dark)' }}>
                      <FaSearch size={11} /> Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setDetail(null)}>
          <div className="w-full max-w-3xl max-h-[80vh] flex flex-col rounded-xl border overflow-hidden" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Multas — {detail.motorista?.nome || 'Motorista'}</h3>
              <button className="bg-transparent border-none cursor-pointer text-xl font-bold" style={{ color: 'var(--text-muted)' }} onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="p-3 border-b flex gap-4 text-sm" style={{ borderColor: 'var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Registro: <strong style={{ color: 'var(--text-primary)' }}>{detail.motorista?.numero_registro}</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>Total multas: <strong style={{ color: 'var(--danger)' }}>{detail.multas.length}</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>Valor: <strong style={{ color: 'var(--danger)' }}>R$ {(detail.total || 0).toFixed(2).replace('.', ',')}</strong></span>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ background: 'var(--table-header-bg)' }}>
                    <th className={thClass}>Local</th>
                    <th className={`${thClass} text-right`}>Valor</th>
                    <th className={thClass}>Vencimento</th>
                    <th className={thClass}>Veículo</th>
                    <th className={thClass}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.multas.map(m => (
                    <tr key={m.id} className="hover:[background:var(--table-row-hover)]" style={{ color: 'var(--text-secondary)' }}>
                      <td className={tdClass}>{m.local_ocorrencia || '-'}</td>
                      <td className={`${tdClass} text-right font-semibold`}>R$ {(m.valor || 0).toFixed(2).replace('.',',')}</td>
                      <td className={tdClass}>{m.data_vencimento ? m.data_vencimento.split('-').reverse().join('/') : '-'}</td>
                      <td className={tdClass}>{m.placa || m.veiculo_id || '-'}</td>
                      <td className={tdClass}>
                        {m.pagamento_realizado == 1 ? (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>Pago</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>Pendente</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
