import React, { useState, useEffect } from 'react';
import { fetchListPaginated } from '../api/client';
import { FaTruck, FaUser, FaRoad, FaMapMarkerAlt, FaCalendarAlt } from 'react-icons/fa';
import { useToast } from './Toast';
import Skeleton from './Skeleton';

export default function HistoricoMotorista({ token, veiculoId }) {
  const toast = useToast();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!veiculoId) { setLoading(false); return; }
    setLoading(true);
    fetchListPaginated(`/api/viagens?veiculo_id=${encodeURIComponent(veiculoId)}&_limit=50`, token)
      .then((result) => {
        setTrips(Array.isArray(result.data) ? result.data : []);
      })
      .catch(() => toast.error('Erro ao carregar histórico'))
      .finally(() => setLoading(false));
  }, [veiculoId, token, toast]);

  if (!veiculoId) {
    return (
      <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Selecione um veículo para ver o histórico de motoristas.
      </div>
    );
  }

  if (loading) return <Skeleton type="card" rows={3} />;

  if (trips.length === 0) {
    return (
      <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Nenhuma viagem encontrada para este veículo.
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
        Histórico de Viagens — <span style={{ color: 'var(--orange)' }}>{veiculoId}</span>
      </h3>
      <div className="relative">
        <div className="absolute left-[17px] top-2 bottom-2 w-0.5" style={{ background: 'var(--border-light)' }} />
        <div className="space-y-6">
          {trips.map((trip) => (
            <div key={trip.id} className="relative flex gap-4">
              <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center z-10" style={{
                background: trip.km_final ? 'var(--orange-bg)' : 'rgba(255,127,30,0.15)',
                color: 'var(--orange)',
              }}>
                <FaTruck size={14} />
              </div>
              <div className="flex-1 p-4 rounded-xl border" style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-light)',
              }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    <FaUser size={12} style={{ color: 'var(--orange)' }} />
                    {trip.motorista_nome || 'Sem motorista'}
                  </div>
                  <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                    #{trip.id}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex items-center gap-1">
                    <FaCalendarAlt size={10} />
                    {trip.data_saida} → {trip.data_retorno || 'Em andamento'}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaRoad size={10} />
                    {trip.km_inicial ?? '?'} km → {trip.km_final ?? 'Em andamento'} km
                    {trip.km_inicial != null && trip.km_final != null && (
                      <span className="ml-1 font-semibold" style={{ color: 'var(--orange)' }}>
                        ({Number(trip.km_final - trip.km_inicial).toLocaleString('pt-BR')} km)
                      </span>
                    )}
                  </span>
                  {trip.destino && (
                    <span className="flex items-center gap-1">
                      <FaMapMarkerAlt size={10} />
                      {trip.destino}
                    </span>
                  )}
                </div>
                {trip.descricao && (
                  <p className="mt-2 text-xs italic" style={{ color: 'var(--text-muted)' }}>
                    {trip.descricao}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
