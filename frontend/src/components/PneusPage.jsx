import React, { useState, useEffect, useCallback } from 'react';
import { fetchListPaginated, deleteItem } from '../api/client';
import { useToast } from './Toast';
import Skeleton from './Skeleton';
import GenericModule from './GenericModule';
import { getByKey } from '../modules/config';
import { FaTrash, FaPlus, FaCheckCircle, FaExclamationTriangle, FaArchive, FaDollarSign } from 'react-icons/fa';

const POSITION_LABELS = {
  dianteiro_esq: 'Dianteiro Esq',
  dianteiro_dir: 'Dianteiro Dir',
  traseiro_esq: 'Traseiro Esq',
  traseiro_dir: 'Traseiro Dir',
  estepe: 'Estepe',
  reserva: 'Reserva',
};

const STATUS_META = {
  ativo: { label: 'Ativo', color: '#22c55e', icon: FaCheckCircle },
  reserva: { label: 'Reserva', color: '#f59e0b', icon: FaArchive },
  inservivel: { label: 'Inservível', color: '#ef4444', icon: FaExclamationTriangle },
  vendido: { label: 'Vendido', color: '#6b7280', icon: FaDollarSign },
};

const inputBase = 'w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors';
const btnBase = 'px-4 py-2 rounded-[12px] font-semibold text-sm border-none cursor-pointer transition-colors';

function TireCard({ tire, onDelete }) {
  const meta = STATUS_META[tire.status] || STATUS_META.ativo;
  const Icon = meta.icon;
  return (
    <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{tire.identificacao || 'Sem ID'}</span>
          <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{
            background: tire.status === 'ativo' ? '#dcfce7' : tire.status === 'reserva' ? '#fef3c7' : tire.status === 'inservivel' ? '#fef2f2' : '#f3f4f6',
            color: meta.color,
          }}>
            <Icon size={10} /> {meta.label}
          </span>
        </div>
        <button onClick={() => onDelete(tire)} className="p-1.5 rounded-lg border-none cursor-pointer hover:opacity-70 transition-opacity"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }} title="Excluir">
          <FaTrash size={11} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
        {tire.marca && <span>{tire.marca}{tire.modelo ? ` ${tire.modelo}` : ''}</span>}
        {tire.medidas && <span>{tire.medidas}</span>}
        {tire.posicao && <span>{POSITION_LABELS[tire.posicao] || tire.posicao}</span>}
        {tire.km_instalacao != null && <span>KM inst: {Number(tire.km_instalacao).toLocaleString('pt-BR')}</span>}
        {tire.dot && <span>DOT: {tire.dot}</span>}
        {tire.valor && <span>R$ {Number(tire.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
      </div>
      {tire.observacoes && (
        <p className="mt-1 text-xs truncate" style={{ color: 'var(--text-muted)' }}>{tire.observacoes}</p>
      )}
    </div>
  );
}

export default function PneusPage({ token }) {
  const toast = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [pneus, setPneus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchListPaginated('/api/veiculos', token)
      .then(r => setVehicles(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, [token]);

  const loadTires = useCallback(() => {
    if (!selectedVehicle) { setPneus([]); setLoading(false); return; }
    setLoading(true);
    fetchListPaginated(`/api/pneus?veiculo_id=${encodeURIComponent(selectedVehicle)}&_limit=100`, token)
      .then(r => setPneus(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error('Erro ao carregar pneus'))
      .finally(() => setLoading(false));
  }, [selectedVehicle, token, toast]);

  useEffect(() => { loadTires(); }, [loadTires]);

  const handleDelete = async (tire) => {
    if (!window.confirm(`Excluir pneu "${tire.identificacao || tire.id}"?`)) return;
    try {
      await deleteItem('/api/pneus', tire.id, token);
      toast.success('Pneu excluído');
      loadTires();
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  const activeCount = pneus.filter(p => p.status === 'ativo').length;
  const inservivelCount = pneus.filter(p => p.status === 'inservivel').length;

  const cfg = getByKey('pneus');

  return (
    <div className="p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex flex-col gap-1 min-w-[250px]">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Veículo</label>
          <select className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            value={selectedVehicle} onChange={e => { setSelectedVehicle(e.target.value); setShowForm(false); }}>
            <option value="">Selecione um veículo</option>
            {vehicles.map(v => (
              <option key={v.placa} value={v.placa}>{v.placa} — {v.fipe_modelo || v.tipo || ''}</option>
            ))}
          </select>
        </div>
        {selectedVehicle && (
          <>
            <div className="flex gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="flex items-center gap-1"><FaCheckCircle size={12} style={{ color: '#22c55e' }} /> {activeCount} ativo(s)</span>
              <span className="flex items-center gap-1"><FaExclamationTriangle size={12} style={{ color: '#ef4444' }} /> {inservivelCount} inservível(is)</span>
              <span className="flex items-center gap-1"><FaArchive size={12} style={{ color: '#f59e0b' }} /> {pneus.filter(p => p.status === 'reserva').length} reserva</span>
            </div>
            <button className={`${btnBase} text-white inline-flex items-center gap-1.5`} style={{ background: 'var(--orange)' }}
              onClick={() => setShowForm(!showForm)}>
              <FaPlus size={12} /> {showForm ? 'Fechar' : 'Novo Pneu'}
            </button>
          </>
        )}
      </div>

      {!selectedVehicle ? (
        <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Selecione um veículo para gerenciar os pneus.
        </div>
      ) : (
        <div className="grid gap-6" style={{ gridTemplateColumns: showForm ? '1fr 1fr' : '1fr' }}>
          {showForm && (
            <div>
              <div className="p-4 rounded-xl border mb-4" style={{ background: 'var(--orange-bg)', borderColor: 'var(--border-light)' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--orange-dark)' }}>Preencha os dados do novo pneu para {selectedVehicle}</span>
              </div>
              <GenericModule
                moduleConfig={cfg}
                token={token}
                vehicles={vehicles}
                cidades={[]}
                filterParams={{ veiculo_id: selectedVehicle }}
                onItemSelect={() => setShowForm(false)}
              />
            </div>
          )}
          <div>
            <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Pneus — {selectedVehicle}
            </h3>
            {loading ? <Skeleton type="card" rows={3} /> : pneus.length === 0 ? (
              <div className="p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                Nenhum pneu cadastrado para este veículo.
              </div>
            ) : (
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {pneus.map(t => <TireCard key={t.id} tire={t} onDelete={handleDelete} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
