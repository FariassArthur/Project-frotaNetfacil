import React, { useState, useEffect, useMemo } from 'react';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt } from 'react-icons/fa';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const TYPE_COLORS = {
  manutencao: '#ff7f1e',
  multa: '#dc3545',
  cnh: '#17a2b8',
  seguro: '#28a745',
  vistoria: '#6f42c1',
  abastecimento: '#ffc107',
  documento: '#fd7e14',
  pagamento_seguro: '#20c997',
};

const TYPE_LABELS = {
  manutencao: 'Manutenção',
  multa: 'Multa',
  cnh: 'CNH',
  seguro: 'Seguro',
  vistoria: 'Vistoria',
  abastecimento: 'Abastecimento',
  documento: 'Documento',
  pagamento_seguro: 'Pgto Seguro',
};

export default function CalendarioEventos() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [veiculos, setVeiculos] = useState([]);
  const [filtroVeiculo, setFiltroVeiculo] = useState('');
  const [today] = useState(() => new Date());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    fetch('/api/veiculos', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.json())
      .then(d => setVeiculos(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const start = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const end = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    setLoading(true);
    const params = new URLSearchParams({ start, end });
    if (filtroVeiculo) params.set('veiculo_id', filtroVeiculo);
    fetch(`/api/calendario/eventos?${params}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(r => r.json())
      .then(data => { setEvents(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [currentMonth, currentYear, filtroVeiculo]);

  const dayEvents = useMemo(() => {
    const map = {};
    for (const ev of events) {
      const d = ev.date;
      if (!map[d]) map[d] = [];
      map[d].push(ev);
    }
    return map;
  }, [events]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDay(null);
  };

  const goToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDay(null);
  };

  const formatDate = (d) => {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return d;
  };

  const selectedEvents = selectedDay ? (dayEvents[selectedDay] || []) : [];

  const cellBase = 'flex flex-col items-center justify-start p-1.5 min-h-[80px] rounded-lg text-xs cursor-pointer transition-colors';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <FaCalendarAlt style={{ color: 'var(--orange)' }} /> Calendário de Eventos
      </h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar grid */}
        <div className="flex-1 rounded-xl border p-4" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <button onClick={prevMonth} className="p-2 rounded-lg border-none cursor-pointer hover:opacity-80"
              style={{ background: 'var(--orange-bg)', color: 'var(--orange)' }}>
              <FaChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {MONTHS[currentMonth]} {currentYear}
              </span>
              <button onClick={goToday} className="px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer hover:opacity-80"
                style={{ background: 'var(--orange-bg)', color: 'var(--orange-dark)', borderColor: 'var(--border-light)' }}>
                Hoje
              </button>
              <select value={filtroVeiculo} onChange={e => setFiltroVeiculo(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border text-xs outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}>
                <option value="">Todos veículos</option>
                {veiculos.map(v => <option key={v.placa} value={v.placa}>{v.placa}{v.numero ? ` (${v.numero})` : ''}</option>)}
              </select>
            </div>
            <button onClick={nextMonth} className="p-2 rounded-lg border-none cursor-pointer hover:opacity-80"
              style={{ background: 'var(--orange-bg)', color: 'var(--orange)' }}>
              <FaChevronRight size={16} />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold py-1" style={{ color: 'var(--text-muted)' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} className={cellBase} style={{ opacity: 0.3 }} />
            ))}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvts = dayEvents[dateStr] || [];
              const isToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day;
              const isSelected = selectedDay === dateStr;

              return (
                <div key={day} onClick={() => setSelectedDay(selectedDay === dateStr ? null : dateStr)}
                  className={cellBase}
                  style={{
                    background: isSelected ? 'var(--orange-bg)' : isToday ? 'var(--bg-tertiary)' : 'transparent',
                    border: isToday ? '1px solid var(--orange)' : '1px solid transparent',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span className={`text-xs font-bold ${isToday ? '' : ''}`}>{day}</span>
                  {dayEvts.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-0.5 w-full justify-center">
                      {dayEvts.slice(0, 3).map(ev => (
                        <div key={ev.id} className="w-1.5 h-1.5 rounded-full" style={{ background: TYPE_COLORS[ev.type] || '#888' }} />
                      ))}
                      {dayEvts.length > 3 && <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>+{dayEvts.length - 3}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
            {Object.entries(TYPE_LABELS).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: TYPE_COLORS[type] || '#888' }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Selected day events panel */}
        <div className="w-full lg:w-80 rounded-xl border p-4" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            {selectedDay ? `Eventos em ${formatDate(selectedDay)}` : 'Selecione um dia'}
          </h2>
          {loading && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</p>}
          {!loading && selectedEvents.length === 0 && selectedDay && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum evento neste dia.</p>
          )}
          <div className="flex flex-col gap-2">
            {selectedEvents.map(ev => (
              <div key={ev.id} className="p-3 rounded-lg border text-sm" style={{ borderColor: 'var(--border-light)', background: 'var(--bg-secondary)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ background: TYPE_COLORS[ev.type] || '#888' }} />
                  <span className="font-semibold text-xs" style={{ color: TYPE_COLORS[ev.type] || '#888' }}>{TYPE_LABELS[ev.type] || ev.type}</span>
                </div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{ev.title}</p>
                {ev.veiculo && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Veículo: {ev.veiculo}</p>}
                {ev.valor && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Valor: R$ {Number(ev.valor).toFixed(2)}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
