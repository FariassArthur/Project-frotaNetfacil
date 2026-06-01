import React, { useState, useEffect, useCallback } from 'react';
import { FaGlobeAmericas, FaPlayCircle, FaStopCircle } from 'react-icons/fa';
import { fetchList, createItem, updateItem, deleteItem } from '../api/client';
import { useToast } from './Toast';

const inputBase = 'w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors';

function formatDate(d) {
  if (!d) return '-';
  return d.substring(0, 10).split('-').reverse().join('/');
}

function formatDateTime(d) {
  if (!d) return '-';
  const parts = d.substring(0, 10).split('-').reverse().join('/');
  return d.length > 10 ? parts + ' ' + d.substring(11, 16) : parts;
}

const SUB_TABS = [
  { key: 'painel', label: 'Painel' },
  { key: 'checkin', label: 'Check-in' },
  { key: 'checkout', label: 'Check-out' },
  { key: 'historico', label: 'Histórico' },
];

export default function ViagensPage({ token, vehicles }) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('painel');
  const [viagens, setViagens] = useState([]);
  const [ativas, setAtivas] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [motoristas, setMotoristas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [dateInicio, setDateInicio] = useState('');
  const [dateFim, setDateFim] = useState('');

  const [checkinForm, setCheckinForm] = useState({
    veiculo_id: '',
    motorista_id: '',
    destino: '',
    km_inicial: '',
    descricao: '',
  });

  const [checkoutForm, setCheckoutForm] = useState({
    id: '',
    km_final: '',
    veiculo_id: '',
  });

  useEffect(() => {
    loadMotoristas();
  }, []);

  useEffect(() => {
    if (activeTab === 'painel') loadEstatisticas();
    if (activeTab === 'historico') loadViagens();
    if (activeTab === 'checkout') loadAtivas();
  }, [activeTab, selectedVehicle, dateInicio, dateFim]);

  const loadMotoristas = async () => {
    try {
      const data = await fetchList('/api/cnhs', token);
      if (Array.isArray(data)) setMotoristas(data);
    } catch (err) { console.error(err); }
  };

  const loadViagens = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ _limit: 100 });
      if (selectedVehicle) params.set('veiculo_id', selectedVehicle);
      const data = await fetchList(`/api/viagens?${params}`, token);
      if (Array.isArray(data)) setViagens(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadAtivas = async () => {
    setLoading(true);
    try {
      const data = await fetchList('/api/viagens/ativas', token);
      if (Array.isArray(data)) setAtivas(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadEstatisticas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedVehicle) params.set('veiculo_id', selectedVehicle);
      if (dateInicio) params.set('data_inicio', dateInicio);
      if (dateFim) params.set('data_fim', dateFim);
      const data = await fetchList(`/api/viagens/estatisticas?${params}`, token);
      if (data && !data.error) setEstatisticas(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCheckin = async (e) => {
    e.preventDefault();
    if (!checkinForm.veiculo_id || !checkinForm.km_inicial) {
      toast.error('Preencha veículo e KM inicial');
      return;
    }
    setLoading(true);
    try {
      await createItem('/api/viagens', {
        ...checkinForm,
        km_inicial: parseInt(checkinForm.km_inicial, 10),
        data_saida: new Date().toISOString().slice(0, 16),
      }, token);
      toast.success('Check-in realizado com sucesso');
      setCheckinForm({ veiculo_id: '', motorista_id: '', destino: '', km_inicial: '', descricao: '' });
      if (activeTab === 'painel') loadEstatisticas();
    } catch (err) {
      toast.error('Erro ao fazer check-in');
      console.error(err);
    } finally { setLoading(false); }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!checkoutForm.id || !checkoutForm.km_final) {
      toast.error('Selecione uma viagem ativa e informe KM final');
      return;
    }
    setLoading(true);
    try {
      await updateItem('/api/viagens', checkoutForm.id, {
        km_final: parseInt(checkoutForm.km_final, 10),
        data_retorno: new Date().toISOString().slice(0, 16),
      }, token);
      toast.success('Check-out realizado com sucesso');
      setCheckoutForm({ id: '', km_final: '', veiculo_id: '' });
      await loadAtivas();
      if (activeTab === 'painel') loadEstatisticas();
    } catch (err) {
      toast.error('Erro ao fazer check-out');
      console.error(err);
    } finally { setLoading(false); }
  };

  const selectParaCheckout = (viagem) => {
    setCheckoutForm({ id: viagem.id, km_final: '', veiculo_id: viagem.veiculo_id });
  };

  const thClass = 'px-3 py-2 text-left text-xs font-bold border-b whitespace-nowrap';
  const tdClass = 'px-3 py-2 text-xs border-b';

  return (
    <div className="p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}><FaGlobeAmericas className="mr-1" /> Monitoramento de Viagens</h2>
        <div className="flex items-center gap-3">
          <select className={inputBase + ' min-w-[180px]'}
            style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)}>
            <option value="">Todos os veículos</option>
            {(vehicles || []).map(v => (
              <option key={v.placa} value={v.placa}>{v.placa} — {v.fipe_modelo || v.tipo || ''}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-1 p-2 overflow-x-auto border-b mb-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
        {SUB_TABS.map((tab) => (
          <button key={tab.key}
            className={`px-4 py-2 text-sm font-semibold rounded-lg border-none cursor-pointer whitespace-nowrap transition-colors ${activeTab === tab.key ? 'text-white' : ''}`}
            style={{
              background: activeTab === tab.key ? 'var(--orange)' : 'transparent',
              color: activeTab === tab.key ? 'white' : 'var(--text-secondary)',
            }}
            onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'painel' && (
        <div>
          {loading ? (
            <div className="flex items-center gap-2 py-8 justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="inline-block w-4 h-4 border-2 border-[var(--orange)] border-t-transparent rounded-full animate-[spin_0.6s_linear_infinite]" />
              Carregando...
            </div>
          ) : (
            <>
              {estatisticas && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
                    <span className="text-2xl font-bold block" style={{ color: 'var(--orange)' }}>{estatisticas.total_viagens}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Total de Viagens</span>
                  </div>
                  <div className="p-4 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
                    <span className="text-2xl font-bold block" style={{ color: 'var(--success)' }}>{parseInt(estatisticas.total_km, 10).toLocaleString('pt-BR')} km</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Total KM Rodados</span>
                  </div>
                  <div className="p-4 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
                    <span className="text-2xl font-bold block" style={{ color: '#007bff' }}>{estatisticas.mes_atual}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Viagens no Mês</span>
                  </div>
                  <div className="p-4 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
                    <span className="text-2xl font-bold block" style={{ color: ativas.length > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{ativas.length}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Em Andamento</span>
                  </div>
                </div>
              )}

              {estatisticas?.por_veiculo?.length > 0 && (
                <div className="rounded-xl border overflow-hidden mb-6" style={{ borderColor: 'var(--border-light)' }}>
                  <div className="px-4 py-3 border-b font-bold text-sm" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}>
                    KM por Veículo
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr style={{ background: 'var(--table-header-bg)' }}>
                          <th className={thClass}>Veículo</th>
                          <th className={thClass + ' text-right'}>Viagens</th>
                          <th className={thClass + ' text-right'}>Total KM</th>
                          <th className={thClass + ' text-right'}>Média KM/Viagem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estatisticas.por_veiculo.map((item, i) => (
                          <tr key={item.veiculo_id} style={{ color: 'var(--text-secondary)' }}>
                            <td className={tdClass}>{item.veiculo_id} {item.fipe_modelo ? `— ${item.fipe_modelo}` : ''}</td>
                            <td className={tdClass + ' text-right'}>{item.total_viagens}</td>
                            <td className={tdClass + ' text-right'}>{parseInt(item.total_km, 10).toLocaleString('pt-BR')} km</td>
                            <td className={tdClass + ' text-right'}>
                              {item.total_viagens > 0 ? Math.round(item.total_km / item.total_viagens).toLocaleString('pt-BR') : 0} km
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {ativas.length > 0 && (
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--danger)' }}>
                  <div className="px-4 py-3 border-b font-bold text-sm flex items-center gap-2" style={{ background: 'rgba(220,53,69,0.08)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                    <span className="inline-block w-2 h-2 rounded-full bg-[var(--danger)] animate-pulse" />
                    Viagens em Andamento
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr style={{ background: 'var(--table-header-bg)' }}>
                          <th className={thClass}>Veículo</th>
                          <th className={thClass}>Motorista</th>
                          <th className={thClass}>Data Saída</th>
                          <th className={thClass}>KM Inicial</th>
                          <th className={thClass}>Destino</th>
                          <th className={thClass}>Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ativas.map((v) => (
                          <tr key={v.id} style={{ color: 'var(--text-secondary)' }}>
                            <td className={tdClass} style={{ fontWeight: 600 }}>{v.veiculo_id}</td>
                            <td className={tdClass}>{v.motorista_nome || v.motorista_id || '-'}</td>
                            <td className={tdClass}>{formatDateTime(v.data_saida)}</td>
                            <td className={tdClass}>{v.km_inicial?.toLocaleString('pt-BR')}</td>
                            <td className={tdClass}>{v.destino || '-'}</td>
                            <td className={tdClass}>
                              <button className="px-3 py-1 rounded-lg text-xs font-semibold text-white border-none cursor-pointer"
                                style={{ background: 'var(--orange)' }}
                                onClick={() => { selectParaCheckout(v); setActiveTab('checkout'); }}>
                                Finalizar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {!estatisticas && !loading && (
                <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Nenhum dado de viagem encontrado. Faça um check-in para começar.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'checkin' && (
        <div className="max-w-2xl mx-auto">
          <div className="p-6 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
            <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}><FaPlayCircle className="mr-1" style={{ color: '#28a745' }} /> Check-in — Iniciar Viagem</h3>
            <form onSubmit={handleCheckin} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Veículo *</label>
                <select className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                  value={checkinForm.veiculo_id} onChange={(e) => setCheckinForm(p => ({ ...p, veiculo_id: e.target.value }))} required>
                  <option value="">Selecione</option>
                  {(vehicles || []).map(v => (
                    <option key={v.placa} value={v.placa}>{v.placa} — {v.fipe_modelo || v.tipo || ''} (KM: {(v.km || 0).toLocaleString('pt-BR')})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Motorista</label>
                <select className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                  value={checkinForm.motorista_id} onChange={(e) => setCheckinForm(p => ({ ...p, motorista_id: e.target.value }))}>
                  <option value="">Selecione</option>
                  {motoristas.map(m => (
                    <option key={m.numero_registro} value={m.numero_registro}>{m.nome} ({m.numero_registro})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>KM Inicial *</label>
                <input type="number" className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                  value={checkinForm.km_inicial} onChange={(e) => setCheckinForm(p => ({ ...p, km_inicial: e.target.value }))} required
                  placeholder="Ex: 50000" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Destino</label>
                <input className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                  value={checkinForm.destino} onChange={(e) => setCheckinForm(p => ({ ...p, destino: e.target.value }))}
                  placeholder="Ex: São Paulo" />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Observação</label>
                <textarea className={inputBase} rows={2} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                  value={checkinForm.descricao} onChange={(e) => setCheckinForm(p => ({ ...p, descricao: e.target.value }))}
                  placeholder="Motivo da viagem..." />
              </div>
              <div className="md:col-span-2">
                <button type="submit" className="px-6 py-3 rounded-[12px] font-semibold text-sm text-white border-none cursor-pointer shadow-lg disabled:opacity-60 inline-flex items-center gap-1.5"
                  style={{ background: '#28a745', boxShadow: '0 8px 20px rgba(40,167,69,0.2)' }}
                  disabled={loading}>
                  {loading ? 'Salvando...' : <><FaPlayCircle style={{ color: '#28a745' }} /> Iniciar Viagem</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'checkout' && (
        <div className="max-w-2xl mx-auto">
          <div className="p-6 rounded-xl border mb-6" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
            <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}><FaStopCircle className="mr-1" style={{ color: '#dc3545' }} /> Check-out — Finalizar Viagem</h3>

            {ativas.length === 0 ? (
              <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                Nenhuma viagem em andamento.
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1 mb-4">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Viagem Ativa</label>
                  <select className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                    value={checkoutForm.id} onChange={(e) => {
                      const v = ativas.find(a => String(a.id) === e.target.value);
                      setCheckoutForm({ id: e.target.value, km_final: '', veiculo_id: v?.veiculo_id || '' });
                    }}>
                    <option value="">Selecione</option>
                    {ativas.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.veiculo_id} — {v.destino || 'Sem destino'} ({formatDateTime(v.data_saida)})
                      </option>
                    ))}
                  </select>
                </div>
                {checkoutForm.id && (
                  <form onSubmit={handleCheckout}>
                    <div className="flex flex-col gap-1 mb-4">
                      <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>KM Final *</label>
                      <input type="number" className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                        value={checkoutForm.km_final} onChange={(e) => setCheckoutForm(p => ({ ...p, km_final: e.target.value }))} required
                        placeholder="Ex: 50750" />
                    </div>
                    <button type="submit" className="px-6 py-3 rounded-[12px] font-semibold text-sm text-white border-none cursor-pointer shadow-lg disabled:opacity-60 inline-flex items-center gap-1.5"
                      style={{ background: '#dc3545', boxShadow: '0 8px 20px rgba(220,53,69,0.2)' }}
                      disabled={loading}>
                      {loading ? 'Salvando...' : <><FaStopCircle style={{ color: '#dc3545' }} /> Finalizar Viagem</>}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>

          {ativas.length > 0 && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-light)' }}>
              <div className="px-4 py-3 border-b font-bold text-sm" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                Viagens em Andamento
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr style={{ background: 'var(--table-header-bg)' }}>
                      <th className={thClass}>Veículo</th>
                      <th className={thClass}>Motorista</th>
                      <th className={thClass}>Saída</th>
                      <th className={thClass}>KM Inicial</th>
                      <th className={thClass}>Destino</th>
                      <th className={thClass}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ativas.map((v) => (
                      <tr key={v.id} style={{ color: 'var(--text-secondary)' }}>
                        <td className={tdClass} style={{ fontWeight: 600 }}>{v.veiculo_id}</td>
                        <td className={tdClass}>{v.motorista_nome || '-'}</td>
                        <td className={tdClass}>{formatDateTime(v.data_saida)}</td>
                        <td className={tdClass}>{v.km_inicial?.toLocaleString('pt-BR')}</td>
                        <td className={tdClass}>{v.destino || '-'}</td>
                        <td className={tdClass}>
                          <button className="px-2 py-1 rounded text-xs font-semibold border-none cursor-pointer"
                            style={{ background: 'var(--orange-bg)', color: 'var(--orange-dark)' }}
                            onClick={() => selectParaCheckout(v)}>
                            Selecionar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'historico' && (
        <div>
          <div className="flex gap-3 items-end mb-4 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Data Início</label>
              <input type="date" className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                value={dateInicio} onChange={(e) => setDateInicio(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Data Fim</label>
              <input type="date" className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                value={dateFim} onChange={(e) => setDateFim(e.target.value)} />
            </div>
            <button className="px-3 py-2 rounded-lg text-xs font-semibold border-none cursor-pointer"
              style={{ background: 'var(--orange)', color: 'white' }}
              onClick={() => { setDateInicio(''); setDateFim(''); }}>
              Limpar
            </button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-8 justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="inline-block w-4 h-4 border-2 border-[var(--orange)] border-t-transparent rounded-full animate-[spin_0.6s_linear_infinite]" />
              Carregando...
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-light)' }}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr style={{ background: 'var(--table-header-bg)' }}>
                      <th className={thClass}>Veículo</th>
                      <th className={thClass}>Modelo</th>
                      <th className={thClass}>Motorista</th>
                      <th className={thClass}>Data Saída</th>
                      <th className={thClass}>Data Retorno</th>
                      <th className={thClass + ' text-right'}>KM Inicial</th>
                      <th className={thClass + ' text-right'}>KM Final</th>
                      <th className={thClass + ' text-right'}>KM Rodados</th>
                      <th className={thClass}>Destino</th>
                      <th className={thClass}>Descrição</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viagens.length === 0 ? (
                      <tr><td className="text-center py-8" style={{ color: 'var(--text-muted)' }} colSpan={10}>Nenhuma viagem encontrada</td></tr>
                    ) : viagens.map((v, i) => {
                      const kmRodados = v.km_final && v.km_inicial ? v.km_final - v.km_inicial : null;
                      return (
                        <tr key={v.id || i} style={{ color: 'var(--text-secondary)' }}>
                          <td className={tdClass} style={{ fontWeight: 600 }}>{v.veiculo_id}</td>
                          <td className={tdClass}>{v.veiculo_modelo || '-'}</td>
                          <td className={tdClass}>{v.motorista_nome || v.motorista_id || '-'}</td>
                          <td className={tdClass}>{formatDateTime(v.data_saida)}</td>
                          <td className={tdClass}>{v.data_retorno ? formatDateTime(v.data_retorno) : <span style={{ color: 'var(--danger)' }}>Em andamento</span>}</td>
                          <td className={tdClass + ' text-right'}>{v.km_inicial?.toLocaleString('pt-BR') || '-'}</td>
                          <td className={tdClass + ' text-right'}>{v.km_final?.toLocaleString('pt-BR') || '-'}</td>
                          <td className={tdClass + ' text-right'} style={{ fontWeight: 600, color: kmRodados ? 'var(--orange)' : undefined }}>
                            {kmRodados ? kmRodados.toLocaleString('pt-BR') + ' km' : '-'}
                          </td>
                          <td className={tdClass}>{v.destino || '-'}</td>
                          <td className={tdClass}>{v.descricao || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
