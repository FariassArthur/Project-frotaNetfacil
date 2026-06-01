import React, { useState, useEffect } from 'react';
import { FaExchangeAlt, FaTachometerAlt, FaGasPump, FaWrench, FaMoneyBillWave } from 'react-icons/fa';
import { fetchList } from '../api/client';
import Skeleton from './Skeleton';

export default function ComparativoVeiculos({ token }) {
  const [veiculos, setVeiculos] = useState([]);
  const [placa1, setPlaca1] = useState('');
  const [placa2, setPlaca2] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchList('/api/veiculos', token).then(d => setVeiculos(d || [])).catch(() => {});
  }, []);

  const compare = async () => {
    if (!placa1 || !placa2) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/veiculos/comparativo?placa1=${placa1}&placa2=${placa2}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResult(await r.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const V = ({ v, side }) => {
    if (!v) return null;
    const c = v.custos;
    const better = (getVal) => {
      if (!result) return '';
      const v1 = getVal(result.veiculo1.custos);
      const v2 = getVal(result.veiculo2.custos);
      if (v1 === v2) return '';
      if (side === 1) return v1 < v2 ? ' ✅' : '';
      return v2 < v1 ? ' ✅' : '';
    };

    return (
      <div className="flex-1 p-4 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--orange)' }}>{v.placa}</h3>
        <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>{v.fipe_modelo || v.fipeNameMarca || '—'}</p>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>KM</span><span className="font-semibold">{c.km?.toLocaleString() || '—'}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>km/L</span><span className="font-semibold">{c.km_l ? `${c.km_l}` : '—'}{better(x => -(x.km_l || 0))}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Manutenção</span><span className="font-semibold" style={{ color: 'var(--danger)' }}>R$ {c.manutencao.toFixed(2).replace('.',',')}{better(x => x.manutencao)}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Combustível</span><span className="font-semibold" style={{ color: '#3b82f6' }}>R$ {c.combustivel.toFixed(2).replace('.',',')}{better(x => x.combustivel)}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Multas</span><span className="font-semibold" style={{ color: 'var(--danger)' }}>R$ {c.multas.toFixed(2).replace('.',',')}{better(x => x.multas)}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Seguro</span><span className="font-semibold">R$ {c.seguro.toFixed(2).replace('.',',')}{better(x => x.seguro)}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Higienização</span><span className="font-semibold">R$ {c.higienizacao.toFixed(2).replace('.',',')}{better(x => x.higienizacao)}</span></div>
          <div className="border-t pt-2 mt-2 flex justify-between" style={{ borderColor: 'var(--border-light)' }}>
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Total</span>
            <span className="font-bold text-base" style={{ color: 'var(--orange)' }}>R$ {c.total.toFixed(2).replace('.',',')}{better(x => x.total)}</span>
          </div>
        </div>
      </div>
    );
  };

  const selectBase = 'w-full px-3 py-2 rounded-lg border text-sm outline-none';
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <FaExchangeAlt style={{ color: 'var(--orange)' }} /> Comparativo de Veículos
      </h1>

      <div className="flex gap-4 items-end mb-6 flex-wrap">
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Veículo 1</label>
          <select value={placa1} onChange={e => setPlaca1(e.target.value)}
            className={selectBase}
            style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}>
            <option value="">-- Selecione --</option>
            {veiculos.map(v => <option key={v.placa} value={v.placa}>{v.placa}{v.numero ? ` (${v.numero})` : ''}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Veículo 2</label>
          <select value={placa2} onChange={e => setPlaca2(e.target.value)}
            className={selectBase}
            style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}>
            <option value="">-- Selecione --</option>
            {veiculos.map(v => <option key={v.placa} value={v.placa}>{v.placa}{v.numero ? ` (${v.numero})` : ''}</option>)}
          </select>
        </div>
        <button onClick={compare} disabled={!placa1 || !placa2 || loading}
          className="px-5 py-2.5 rounded-[12px] font-semibold text-sm text-white border-none cursor-pointer shadow-lg disabled:opacity-50"
          style={{ background: 'var(--orange)' }}>
          Comparar
        </button>
      </div>

      {loading && <Skeleton type="card" rows={4} />}

      {result && !loading && (
        <div className="flex gap-6 flex-col lg:flex-row">
          <V v={result.veiculo1} side={1} />
          <div className="flex items-center justify-center text-2xl" style={{ color: 'var(--text-muted)' }}><FaExchangeAlt /></div>
          <V v={result.veiculo2} side={2} />
        </div>
      )}
    </div>
  );
}
