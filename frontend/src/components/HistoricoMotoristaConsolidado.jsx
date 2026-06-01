import React, { useState, useEffect } from 'react';
import { FaHistory, FaCar, FaExclamationTriangle, FaGasPump, FaRoad } from 'react-icons/fa';
import { exportPDF, exportMultipleTables } from '../utils/pdf';
import { fetchList } from '../api/client';
import Skeleton from './Skeleton';

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export default function HistoricoMotorista({ token }) {
  const [motoristas, setMotoristas] = useState([]);
  const [selectedReg, setSelectedReg] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchList('/api/cnhs', token).then(d => setMotoristas(d || [])).catch(() => {});
  }, []);

  const loadHistorico = async () => {
    if (!selectedReg) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/motorista/historico/${selectedReg}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(await r.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const filtered = motoristas.filter(m =>
    !searchTerm || m.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.numero_registro?.includes(searchTerm)
  );

  const exportHistorico = () => {
    if (!data) return;
    const tables = [];
    if (data.multas.length > 0) {
      tables.push({
        name: 'Multas',
        headers: ['Local', 'Valor', 'Vencimento', 'Veículo', 'Status'],
        rows: data.multas.map(m => [m.local_ocorrencia || '-', `R$ ${(m.valor || 0).toFixed(2)}`, m.data_vencimento || '-', m.placa || m.veiculo_id || '-', m.pagamento_realizado ? 'Pago' : 'Pendente']),
      });
    }
    if (data.viagens.length > 0) {
      tables.push({
        name: 'Viagens',
        headers: ['Data Saída', 'Data Retorno', 'Destino', 'Veículo', 'KM'],
        rows: data.viagens.map(v => [v.data_saida || '-', v.data_retorno || '-', v.destino || '-', v.placa || '-', v.km_final ? `${v.km_final} km` : '-']),
      });
    }
    exportMultipleTables(`Histórico - ${data.motorista.nome}`, tables, `historico_${data.motorista.numero_registro}.pdf`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <FaHistory style={{ color: 'var(--orange)' }} /> Histórico do Motorista
      </h1>

      <div className="flex gap-4 items-end mb-6 flex-wrap">
        <div className="flex flex-col gap-1 min-w-[250px]">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Motorista</label>
          <input type="text" placeholder="Buscar motorista..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
          />
          <div className="relative">
            <select value={selectedReg} onChange={e => setSelectedReg(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none mt-1"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
              size={Math.min(5, filtered.length + 1)}
            >
              <option value="">-- Selecione --</option>
              {filtered.map(m => (
                <option key={m.numero_registro} value={m.numero_registro}>{m.nome} ({m.numero_registro})</option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={loadHistorico} disabled={!selectedReg || loading}
          className="px-5 py-2.5 rounded-[12px] font-semibold text-sm text-white border-none cursor-pointer shadow-lg disabled:opacity-50"
          style={{ background: 'var(--orange)' }}>
          {loading ? 'Carregando...' : 'Carregar Histórico'}
        </button>
      </div>

      {loading && <Skeleton type="card" rows={4} />}

      {data && !loading && (
        <>
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="flex-1 min-w-[140px] p-4 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Multas</span>
              <span className="text-xl font-bold block" style={{ color: 'var(--danger)' }}>{data.multas.length}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>R$ {data.resumo.total_multas.toFixed(2).replace('.',',')} — {data.resumo.multas_pendentes} pendente(s)</span>
            </div>
            <div className="flex-1 min-w-[140px] p-4 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Viagens</span>
              <span className="text-xl font-bold block" style={{ color: 'var(--orange)' }}>{data.viagens.length}</span>
            </div>
            <div className="flex-1 min-w-[140px] p-4 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Abastecimentos</span>
              <span className="text-xl font-bold block" style={{ color: 'var(--orange)' }}>{data.abastecimentos.length}</span>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button onClick={exportHistorico}
              className="px-4 py-2 rounded-[12px] font-semibold text-sm text-white border-none cursor-pointer shadow-lg inline-flex items-center gap-1.5"
              style={{ background: 'var(--orange)' }}>
              Exportar PDF
            </button>
          </div>

          {data.multas.length > 0 && (
            <section className="mb-6">
              <h2 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <FaExclamationTriangle style={{ color: 'var(--danger)' }} /> Multas ({data.multas.length})
              </h2>
              <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead><tr style={{ background: 'var(--table-header-bg)' }}>
                      <th className="px-3.5 py-3 text-left text-sm font-bold border-b">Local</th>
                      <th className="px-3.5 py-3 text-right text-sm font-bold border-b">Valor</th>
                      <th className="px-3.5 py-3 text-left text-sm font-bold border-b">Vencimento</th>
                      <th className="px-3.5 py-3 text-left text-sm font-bold border-b">Veículo</th>
                      <th className="px-3.5 py-3 text-left text-sm font-bold border-b">Status</th>
                    </tr></thead>
                    <tbody>
                      {data.multas.map(m => (
                        <tr key={m.id} className="hover:[background:var(--table-row-hover)]" style={{ color: 'var(--text-secondary)' }}>
                          <td className="px-3.5 py-3 text-sm border-b">{m.local_ocorrencia || '-'}</td>
                          <td className="px-3.5 py-3 text-sm border-b text-right font-semibold">R$ {(m.valor || 0).toFixed(2).replace('.',',')}</td>
                          <td className="px-3.5 py-3 text-sm border-b">{m.data_vencimento ? m.data_vencimento.split('-').reverse().join('/') : '-'}</td>
                          <td className="px-3.5 py-3 text-sm border-b">{m.placa || m.veiculo_id || '-'}</td>
                          <td className="px-3.5 py-3 text-sm border-b">
                            {m.pagamento_realizado == 1 ? (
                              <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background:'var(--success-bg)', color:'var(--success)' }}>Pago</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background:'var(--danger-bg)', color:'var(--danger)' }}>Pendente</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {data.viagens.length > 0 && (
            <section className="mb-6">
              <h2 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <FaRoad style={{ color: 'var(--orange)' }} /> Viagens ({data.viagens.length})
              </h2>
              <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead><tr style={{ background: 'var(--table-header-bg)' }}>
                      <th className="px-3.5 py-3 text-left text-sm font-bold border-b">Saída</th>
                      <th className="px-3.5 py-3 text-left text-sm font-bold border-b">Retorno</th>
                      <th className="px-3.5 py-3 text-left text-sm font-bold border-b">Destino</th>
                      <th className="px-3.5 py-3 text-left text-sm font-bold border-b">Veículo</th>
                      <th className="px-3.5 py-3 text-right text-sm font-bold border-b">KM Inicial</th>
                      <th className="px-3.5 py-3 text-right text-sm font-bold border-b">KM Final</th>
                    </tr></thead>
                    <tbody>
                      {data.viagens.map(v => (
                        <tr key={v.id} className="hover:[background:var(--table-row-hover)]" style={{ color: 'var(--text-secondary)' }}>
                          <td className="px-3.5 py-3 text-sm border-b">{v.data_saida || '-'}</td>
                          <td className="px-3.5 py-3 text-sm border-b">{v.data_retorno || '-'}</td>
                          <td className="px-3.5 py-3 text-sm border-b">{v.destino || '-'}</td>
                          <td className="px-3.5 py-3 text-sm border-b">{v.placa || '-'}</td>
                          <td className="px-3.5 py-3 text-sm border-b text-right">{v.km_inicial || '-'}</td>
                          <td className="px-3.5 py-3 text-sm border-b text-right">{v.km_final || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {data.abastecimentos.length > 0 && (
            <section className="mb-6">
              <h2 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <FaGasPump style={{ color: '#3b82f6' }} /> Abastecimentos ({data.abastecimentos.length})
              </h2>
              <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead><tr style={{ background: 'var(--table-header-bg)' }}>
                      <th className="px-3.5 py-3 text-left text-sm font-bold border-b">Data</th>
                      <th className="px-3.5 py-3 text-left text-sm font-bold border-b">Veículo</th>
                      <th className="px-3.5 py-3 text-right text-sm font-bold border-b">Litros</th>
                      <th className="px-3.5 py-3 text-right text-sm font-bold border-b">Valor</th>
                      <th className="px-3.5 py-3 text-right text-sm font-bold border-b">KM</th>
                    </tr></thead>
                    <tbody>
                      {data.abastecimentos.map(a => (
                        <tr key={a.id} className="hover:[background:var(--table-row-hover)]" style={{ color: 'var(--text-secondary)' }}>
                          <td className="px-3.5 py-3 text-sm border-b">{a.data || '-'}</td>
                          <td className="px-3.5 py-3 text-sm border-b">{a.placa || '-'}</td>
                          <td className="px-3.5 py-3 text-sm border-b text-right">{a.quantidade || '-'}</td>
                          <td className="px-3.5 py-3 text-sm border-b text-right">R$ {(a.valor || 0).toFixed(2).replace('.',',')}</td>
                          <td className="px-3.5 py-3 text-sm border-b text-right">{a.km || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
