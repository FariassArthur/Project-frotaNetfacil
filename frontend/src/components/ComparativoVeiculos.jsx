import React, { useState, useEffect } from 'react';
import { FaExchangeAlt, FaTachometerAlt, FaGasPump, FaWrench, FaMoneyBillWave, FaCheckCircle, FaShieldAlt, FaCar, FaBroom } from 'react-icons/fa';
import { fetchList } from '../api/client';
import Skeleton from './Skeleton';

const fmt = (n) => (n ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => (n ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function ComparativoVeiculos({ token }) {
  const [veiculos, setVeiculos] = useState([]);
  const [placa1, setPlaca1] = useState('');
  const [placa2, setPlaca2] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchList('/api/veiculos', token).then(d => setVeiculos(d || [])).catch(e => console.error('Erro ao carregar veículos:', e));
  }, []);

  const compare = async () => {
    if (!placa1 || !placa2) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchList(`/api/veiculos/comparativo?placa1=${encodeURIComponent(placa1)}&placa2=${encodeURIComponent(placa2)}`, token);
      if (!data.veiculo1 || !data.veiculo2) {
        setError(data.error || 'Erro ao carregar comparativo');
        setResult(null);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Erro de conexão ao servidor');
      console.error(err);
    }
    setLoading(false);
  };

  const fields = [
    { key: 'km', label: 'Odômetro', icon: FaTachometerAlt, fmt: fmtInt, suffix: ' km', better: false, color: null },
    { key: 'km_percorrido', label: 'Km Percorrido', icon: FaTachometerAlt, fmt: fmtInt, suffix: ' km', better: false, color: null },
    { key: 'km_l', label: 'km/L', icon: FaGasPump, fmt: v => v !== null && v !== undefined ? v.toFixed(2) : '—', suffix: '', better: true, color: '#10b981' },
    { key: 'custo_por_km', label: 'R$/km', icon: FaMoneyBillWave, fmt: v => v !== null ? `R$ ${v.toFixed(2)}` : '—', suffix: '', better: false, color: '#f59e0b' },
    { key: 'combustivel', label: 'Combustível', icon: FaGasPump, fmt: v => `R$ ${fmt(v)}`, suffix: '', better: false, color: '#3b82f6' },
    { key: 'manutencao', label: 'Manutenção', icon: FaWrench, fmt: v => `R$ ${fmt(v)}`, suffix: '', better: false, color: '#ef4444' },
    { key: 'multas', label: 'Multas', icon: FaMoneyBillWave, fmt: v => `R$ ${fmt(v)}`, suffix: '', better: false, color: '#dc2626' },
    { key: 'seguro', label: 'Seguro', icon: FaShieldAlt, fmt: v => `R$ ${fmt(v)}`, suffix: '', better: false, color: '#8b5cf6' },
    { key: 'higienizacao', label: 'Higienização', icon: FaBroom, fmt: v => `R$ ${fmt(v)}`, suffix: '', better: false, color: '#ec4899' },
    { key: 'ordens_servico', label: 'Ordens de Serviço', icon: FaWrench, fmt: v => `R$ ${fmt(v)}`, suffix: '', better: false, color: '#14b8a6' },
  ];

  const BetterBadge = ({ cond, small }) =>
    cond ? <span className="inline-flex items-center gap-0.5" style={{ color: '#10b981', fontSize: small ? '0.65rem' : '0.75rem', fontWeight: 600, marginLeft: 4 }}><FaCheckCircle /> Melhor</span> : null;

  const Bar = ({ v1, v2, fkey }) => {
    const a = result?.veiculo1?.custos?.[fkey] ?? 0;
    const b = result?.veiculo2?.custos?.[fkey] ?? 0;
    if ((!a && a !== 0) || (!b && b !== 0)) return null;
    const max = Math.max(Math.abs(a), Math.abs(b)) || 1;
    const w1 = (Math.abs(a) / max) * 100;
    const w2 = (Math.abs(b) / max) * 100;
    const field = fields.find(f => f.key === fkey);
    const betterVal = (va, vb) => {
      if (va == null || vb == null) return 0;
      return field?.better ? (va > vb ? 1 : va < vb ? -1 : 0) : (va < vb ? 1 : va > vb ? -1 : 0);
    };
    const winner = betterVal(a, b);
    return (
      <div className="flex items-center gap-2 py-1.5">
        <div className="flex-1 flex items-center gap-1.5">
          <div className="h-2 rounded-full transition-all" style={{ width: `${w1}%`, background: winner === 1 ? '#10b981' : (field?.color || 'var(--orange)'), opacity: winner === 1 ? 1 : 0.4 }} />
        </div>
        <div className="flex-1 flex items-center gap-1.5 justify-end">
          <div className="h-2 rounded-full transition-all" style={{ width: `${w2}%`, background: winner === -1 ? '#10b981' : (field?.color || 'var(--orange)'), opacity: winner === -1 ? 1 : 0.4 }} />
        </div>
      </div>
    );
  };

  const Card = ({ v, side }) => {
    if (!v) return null;
    const c = v.custos;
    const melhor = (key) => {
      const val = c?.[key];
      const outro = side === 1 ? result?.veiculo2?.custos?.[key] : result?.veiculo1?.custos?.[key];
      if (val == null || outro == null || val === outro) return false;
      const field = fields.find(f => f.key === key);
      return field?.better ? val > outro : val < outro;
    };

    return (
      <div className="flex-1 min-w-0 rounded-xl border p-4" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--orange)' }}>{v.placa}</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.fipe_modelo || v.fipe_name_marca || '—'}{v.tipo ? ` · ${v.tipo}` : ''}</p>
          </div>
          <div className="text-right">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Km</span>
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{fmtInt(c.km)}</p>
          </div>
        </div>

        <div className="space-y-0 divide-y" style={{ borderColor: 'var(--border-light)' }}>
          {fields.map(f => {
            const val = c?.[f.key];
            const display = val !== null && val !== undefined ? f.fmt(val) : '—';
            const isBetter = melhor(f.key);
            return (
              <div key={f.key} className="py-2">
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    <f.icon size={12} style={{ marginRight: 4, color: f.color || 'var(--text-muted)' }} />
                    {f.label}
                  </span>
                  <span className="font-semibold" style={{ color: isBetter ? '#10b981' : 'var(--text-primary)' }}>
                    {display}{f.suffix}
                    <BetterBadge cond={isBetter} />
                  </span>
                </div>
                <Bar v1={result?.veiculo1?.custos?.[f.key]} v2={result?.veiculo2?.custos?.[f.key]} fkey={f.key} key={f.key} />
              </div>
            );
          })}
        </div>

        <div className="border-t pt-3 mt-1 flex justify-between items-center" style={{ borderColor: 'var(--border-light)' }}>
          <span className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>Total</span>
          <span className="font-bold text-lg" style={{ color: melhor('total') ? '#10b981' : 'var(--orange)' }}>
            R$ {fmt(c.total)}
            <BetterBadge cond={melhor('total')} />
          </span>
        </div>
      </div>
    );
  };

  const selectBase = 'w-full px-3 py-2 rounded-lg border text-sm outline-none';
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <FaExchangeAlt style={{ color: 'var(--orange)' }} /> Comparativo de Veículos
        </h1>
      </div>

      <div className="flex gap-4 items-end mb-6 flex-wrap">
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Veículo 1</label>
          <select value={placa1} onChange={e => setPlaca1(e.target.value)}
            className={selectBase}
            style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}>
            <option value="">-- Selecione --</option>
            {veiculos.map(v => <option key={v.placa} value={v.placa}>{v.placa}{v.numero ? ` (${v.numero})` : ''}{v.fipe_modelo ? ` — ${v.fipe_modelo}` : ''}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Veículo 2</label>
          <select value={placa2} onChange={e => setPlaca2(e.target.value)}
            className={selectBase}
            style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}>
            <option value="">-- Selecione --</option>
            {veiculos.map(v => <option key={v.placa} value={v.placa}>{v.placa}{v.numero ? ` (${v.numero})` : ''}{v.fipe_modelo ? ` — ${v.fipe_modelo}` : ''}</option>)}
          </select>
        </div>
        <button onClick={compare} disabled={!placa1 || !placa2 || loading}
          className="px-5 py-2.5 rounded-[12px] font-semibold text-sm text-white border-none cursor-pointer shadow-lg disabled:opacity-50"
          style={{ background: 'var(--orange)' }}>
          {loading ? 'Comparando…' : 'Comparar'}
        </button>
      </div>

      {loading && <Skeleton type="card" rows={4} />}

      {error && (
        <div className="text-center py-3 px-4 rounded-xl mb-4" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <p className="text-sm font-semibold" style={{ color: '#dc2626' }}>{error}</p>
        </div>
      )}

      {result && !loading && (() => {
        const t1 = result.veiculo1.custos.total;
        const t2 = result.veiculo2.custos.total;
        const winner = t1 < t2 ? 1 : t2 < t1 ? 2 : 0;
        const diff = t1 !== t2 ? Math.abs(t1 - t2) : 0;
        return (
          <div className="space-y-6">
            {winner > 0 && (
              <div className="text-center py-3 px-4 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <p className="text-sm font-semibold" style={{ color: '#16a34a' }}>
                  <FaCheckCircle size={16} style={{ display: 'inline', marginRight: 6 }} />
                  {result[`veiculo${winner}`].placa} tem <strong>R$ {fmt(diff)}</strong> de custo total a menos
                </p>
              </div>
            )}
            <div className="flex gap-6 flex-col lg:flex-row">
              <Card v={result.veiculo1} side={1} />
              <div className="flex items-center justify-center text-2xl shrink-0" style={{ color: 'var(--text-muted)' }}><FaExchangeAlt /></div>
              <Card v={result.veiculo2} side={2} />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
