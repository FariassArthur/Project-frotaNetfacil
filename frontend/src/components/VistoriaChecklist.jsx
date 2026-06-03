import React, { useState, useEffect } from 'react';
import { fetchListPaginated, createItem, updateItem } from '../api/client';
import { useToast } from './Toast';
import Skeleton from './Skeleton';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const CHECKLIST_SECTIONS = [
  {
    title: 'Níveis',
    items: [
      { id: 1, key: 'nivel_oleo', label: 'Nível de óleo do motor' },
      { id: 2, key: 'nivel_fluido_freios', label: 'Nível do fluido de freios' },
      { id: 3, key: 'nivel_agua_arrefecimento', label: 'Nível de água do sistema de arrefecimento' },
      { id: 4, key: 'nivel_agua_parabrisa', label: 'Nível de água reservatório para-brisa' },
    ],
  },
  {
    title: 'Dianteira / Iluminação',
    items: [
      { id: 9, key: 'moldura_dianteira_esq', label: 'Situação física moldura dianteira esquerda' },
      { id: 10, key: 'retrovisor_esq', label: 'Situação física espelho retrovisor esquerdo' },
      { id: 11, key: 'farol_direito', label: 'Situação física farol direito' },
      { id: 12, key: 'moldura_dianteira_dir', label: 'Situação física moldura dianteira direita' },
      { id: 13, key: 'retrovisor_dir', label: 'Situação física espelho retrovisor direito' },
      { id: 14, key: 'pisca_alerta_dianteiro', label: 'Pisca alerta dianteiro' },
      { id: 15, key: 'espelho_interno', label: 'Espelho interno' },
      { id: 17, key: 'farol_alto', label: 'Farol alto' },
      { id: 18, key: 'farol_baixo', label: 'Farol Baixo' },
      { id: 19, key: 'placa_dianteira', label: 'Situação placa dianteira' },
      { id: 20, key: 'parachoque_dianteiro', label: 'Para-choque dianteiro' },
      { id: 21, key: 'buzina', label: 'Buzina' },
    ],
  },
  {
    title: 'Traseiro',
    items: [
      { id: 22, key: 'situacao_parabrisa_traseiro', label: 'Situação física para-brisa traseiro' },
      { id: 23, key: 'limpador_parabrisa_traseiro', label: 'Limpador para-brisa traseiro' },
      { id: 24, key: 'lavador_parabrisa_traseiro', label: 'Lavador para-brisa traseiro' },
      { id: 25, key: 'luz_freio', label: 'Luz de freio' },
      { id: 26, key: 'lanterna_esq_traseira', label: 'Situação física lanterna esquerda traseira' },
      { id: 27, key: 'lanterna_dir_traseira', label: 'Situação física lanterna direita traseira' },
      { id: 28, key: 'moldura_traseira_dir', label: 'Situação física moldura traseira direita' },
      { id: 29, key: 'portinhola', label: 'Portinhola' },
      { id: 30, key: 'moldura_traseira_esq', label: 'Situação física moldura traseira esquerda' },
      { id: 31, key: 'pisca_alerta_traseiro', label: 'Pisca alerta traseiro' },
      { id: 32, key: 'pisca_esq_traseiro', label: 'Pisca esquerdo traseiro' },
      { id: 33, key: 'pisca_dir_traseiro', label: 'Pisca direito traseiro' },
      { id: 34, key: 'parachoque_traseiro', label: 'Para-choque traseiro' },
      { id: 35, key: 'luz_re', label: 'Luz de ré' },
      { id: 36, key: 'luz_placa', label: 'Luz de placa' },
      { id: 37, key: 'situacao_placa_traseira', label: 'Situação placa traseira' },
    ],
  },
  {
    title: 'Porta Malas / Ferramentas',
    items: [
      { id: 38, key: 'fechadura_porta_malas', label: 'Fechadura porta malas' },
      { id: 39, key: 'borracha_vedacao_porta_malas', label: 'Borracha de vedação porta malas' },
      { id: 40, key: 'triangulo_advertencia', label: 'Triângulo de advertência' },
      { id: 41, key: 'pneu_estepe', label: 'Pneu estepe' },
      { id: 42, key: 'chave_roda', label: 'Chave de roda' },
      { id: 43, key: 'macaco', label: 'Macaco' },
      { id: 44, key: 'suporte_escadas', label: 'Suporte para escadas' },
    ],
  },
  {
    title: 'Portas / Vidros',
    items: [
      { id: 45, key: 'borrachas_vedacao_portas', label: 'Borrachas de vedação das portas' },
      { id: 46, key: 'manivelas_portas_traseiras', label: 'Manivelas portas traseiras' },
      { id: 47, key: 'vidros_traseiros', label: 'Vidros traseiros' },
    ],
  },
  {
    title: 'Freios / Câmbio',
    items: [
      { id: 48, key: 'freio_pe', label: 'Freio de pé' },
      { id: 49, key: 'freio_estacionamento', label: 'Freio de estacionamento' },
      { id: 50, key: 'cambio_coifa', label: 'Câmbio (coifa)' },
    ],
  },
  {
    title: 'Interno / Painel',
    items: [
      { id: 51, key: 'luz_cortesia', label: 'Luz cortesia' },
      { id: 52, key: 'antena_interna', label: 'Antena interna' },
      { id: 55, key: 'quebra_sol', label: 'Quebra sol' },
      { id: 56, key: 'documento_crlv', label: 'Documento (CRLV)' },
      { id: 57, key: 'difusores_ar', label: 'Difusores de ar' },
      { id: 58, key: 'porta_luvas', label: 'Porta luvas' },
      { id: 59, key: 'manual', label: 'Manual' },
      { id: 60, key: 'ar_condicionado', label: 'Ar condicionado' },
      { id: 61, key: 'circulador_ar', label: 'Circulador de ar' },
      { id: 62, key: 'som', label: 'Som' },
      { id: 63, key: 'tomada_12v', label: 'Tomada 12 volts' },
      { id: 64, key: 'iluminacao_painel', label: 'Iluminação/luzes do Painel' },
      { id: 65, key: 'vidros_eletricos', label: 'Vidros elétricos' },
      { id: 66, key: 'travas', label: 'Travas' },
    ],
  },
  {
    title: 'Segurança / Acabamento',
    items: [
      { id: 67, key: 'cintos_seguranca', label: 'Cintos de segurança' },
      { id: 68, key: 'tapetes', label: 'Tapetes' },
      { id: 69, key: 'estofados', label: 'Estofados' },
      { id: 70, key: 'bancos', label: 'Bancos' },
      { id: 71, key: 'teto', label: 'Teto' },
      { id: 72, key: 'limpeza_interna', label: 'Limpeza interna' },
      { id: 73, key: 'organizacao_interna', label: 'Organização interna' },
      { id: 74, key: 'pneus', label: 'Pneus' },
    ],
  },
  {
    title: 'Adesivos "LEMBRETES"',
    items: [
      { id: 75, key: 'adesivos_lembretes', label: 'Adesivos "LEMBRETES"' },
    ],
  },
  {
    title: 'Para-brisa e painel central',
    items: [
      { id: 76, key: 'parabrisa_dianteiro_situacao', label: 'Para-brisa dianteiro — Situação física' },
      { id: 77, key: 'parabrisa_dianteiro_limpador', label: 'Para-brisa dianteiro — Limpador' },
      { id: 78, key: 'parabrisa_dianteiro_lavador', label: 'Para-brisa dianteiro — Lavador' },
      { id: 79, key: 'painel_central_situacao', label: 'Painel central — Situação física' },
    ],
  },
  {
    title: 'Calibragens / Calotas',
    items: [
      { id: 80, key: 'calibragem_pde', label: 'Calibragem P.D.E (Pneu Dianteiro Esquerdo)' },
      { id: 81, key: 'calibragem_pte', label: 'Calibragem P.T.E (Pneu Traseiro Esquerdo)' },
      { id: 82, key: 'calibragem_ptd', label: 'Calibragem P.T.D (Pneu Traseiro Direito)' },
      { id: 83, key: 'calibragem_pdd', label: 'Calibragem P.D.D (Pneu Dianteiro Direito)' },
    ],
  },
];

const CHECKLIST_ITENS = CHECKLIST_SECTIONS.flatMap(s => s.items);

const inputBase = 'w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors';

const STATUS_C = { value: 'C', label: 'C', full: 'Conforme', color: '#22c55e', bg: '#dcfce7' };
const STATUS_NC = { value: 'NC', label: 'NC', full: 'Não Conforme', color: '#ef4444', bg: '#fef2f2' };
const STATUS_OPTIONS = [STATUS_C, STATUS_NC];

function StatusBadge({ status }) {
  if (status === 'C') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
        style={{ background: STATUS_C.bg, color: STATUS_C.color }}>
        <FaCheckCircle size={10} /> C
      </span>
    );
  }
  if (status === 'NC') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
        style={{ background: STATUS_NC.bg, color: STATUS_NC.color }}>
        <FaExclamationTriangle size={10} /> NC
      </span>
    );
  }
  return null;
}

function formatDate(d) {
  if (!d) return '';
  return d.substring(0, 10);
}

export default function VistoriaChecklist({ token, veiculoId }) {
  const toast = useToast();

  const [vehicles, setVehicles] = useState([]);
  const [vistorias, setVistorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(veiculoId || '');
  const [editId, setEditId] = useState(null);

  const newForm = () => ({
    data: new Date().toISOString().substring(0, 10),
    tipo: 'saida',
    km: '',
    motorista_nome: '',
    observacoes: '',
    status: 'ok',
    itens: CHECKLIST_ITENS.map(item => ({ ...item, item_status: 'C', observacao: '' })),
    path_foto: null,
  });

  const [form, setForm] = useState(newForm());

  useEffect(() => {
    fetchListPaginated('/api/veiculos', token)
      .then(r => setVehicles(Array.isArray(r.data) ? r.data : []))
      .catch(e => console.error('Erro ao carregar veículos:', e));
  }, [token]);

  useEffect(() => {
    if (!selectedVehicle) { setVistorias([]); setLoading(false); return; }
    setLoading(true);
    fetchListPaginated(`/api/vistorias?veiculo_id=${encodeURIComponent(selectedVehicle)}&_limit=50`, token)
      .then(r => setVistorias(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error('Erro ao carregar vistorias'))
      .finally(() => setLoading(false));
  }, [selectedVehicle, token, toast]);

  const handleItemStatus = (key, status) => {
    setForm(prev => ({
      ...prev,
      itens: prev.itens.map(item =>
        item.key === key ? { ...item, item_status: status } : item
      ),
    }));
  };

  const handleItemObs = (key, observacao) => {
    setForm(prev => ({
      ...prev,
      itens: prev.itens.map(item =>
        item.key === key ? { ...item, observacao } : item
      ),
    }));
  };

  const loadForEdit = (vistoria) => {
    setEditId(vistoria.id);
    try {
      const parsed = typeof vistoria.itens === 'string'
        ? JSON.parse(vistoria.itens)
        : (vistoria.itens || []);
      const merged = CHECKLIST_ITENS.map(template => {
        const existing = parsed.find(p => p.key === template.key);
        if (existing) return existing;
        return { ...template, item_status: 'C', observacao: '' };
      });
      setForm({
        data: formatDate(vistoria.data),
        tipo: vistoria.tipo || 'saida',
        km: vistoria.km || '',
        motorista_nome: vistoria.motorista_nome || '',
        observacoes: vistoria.observacoes || '',
        status: vistoria.status || 'ok',
        itens: merged,
        path_foto: null,
      });
    } catch {
      setForm(newForm());
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditId(null);
    setForm(newForm());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) { toast.error('Selecione um veículo'); return; }
    setSaving(true);
    try {
      const body = {
        veiculo_id: selectedVehicle,
        data: form.data,
        tipo: form.tipo,
        km: form.km ? Number(form.km) : null,
        motorista_nome: form.motorista_nome,
        observacoes: form.observacoes,
        status: form.status,
        itens: JSON.stringify(form.itens),
      };
      if (editId) {
        await updateItem('/api/vistorias', editId, body, token);
        toast.success('Vistoria atualizada');
      } else {
        await createItem('/api/vistorias', body, token);
        toast.success('Vistoria registrada');
      }
      resetForm();
      fetchListPaginated(`/api/vistorias?veiculo_id=${encodeURIComponent(selectedVehicle)}&_limit=50`, token)
        .then(r => setVistorias(Array.isArray(r.data) ? r.data : []));
    } catch (err) {
      toast.error('Erro ao salvar vistoria');
    } finally {
      setSaving(false);
    }
  };

  const ncCount = form.itens.filter(i => i.item_status === 'NC').length;
  const cCount = form.itens.filter(i => i.item_status === 'C').length;
  const totalItems = CHECKLIST_ITENS.length;

  return (
    <div className="p-6" style={{ background: 'var(--bg-primary)' }}>
      {!veiculoId && (
        <div className="mb-6">
          <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Veículo</label>
          <select
            className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)', maxWidth: 300 }}
            value={selectedVehicle} onChange={(e) => { setSelectedVehicle(e.target.value); resetForm(); }}
          >
            <option value="">Selecione um veículo</option>
            {vehicles.map(v => (
              <option key={v.placa} value={v.placa}>{v.placa} — {v.fipe_modelo || v.tipo || ''}</option>
            ))}
          </select>
        </div>
      )}

      {!selectedVehicle ? (
        <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Selecione um veículo para iniciar o checklist.
        </div>
      ) : (
        <>
          <div className="grid-responsive-cols two-col">
            <div className="p-5 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  {editId ? 'Editar Vistoria' : 'Nova Vistoria'}
                </h3>
                {editId && (
                  <button onClick={resetForm} className="text-xs font-semibold px-3 py-1 rounded-lg border-none cursor-pointer"
                    style={{ background: 'var(--orange)', color: '#fff' }}>Nova</button>
                )}
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Data</label>
                    <input type="date" className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                      value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} required />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Tipo</label>
                    <select className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                      value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                      <option value="saida">Saída</option>
                      <option value="retorno">Retorno</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>KM</label>
                    <input type="number" className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                      value={form.km} onChange={e => setForm(p => ({ ...p, km: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Motorista</label>
                    <input type="text" className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                      value={form.motorista_nome} onChange={e => setForm(p => ({ ...p, motorista_nome: e.target.value }))} />
                  </div>
                </div>

                <div className="space-y-4 mb-4 max-h-[600px] overflow-y-auto pr-1">
                  {CHECKLIST_SECTIONS.map(section => (
                    <div key={section.title}>
                      <div className="text-xs font-bold uppercase tracking-wider mb-2 pb-1 border-b"
                        style={{ color: 'var(--orange)', borderColor: 'var(--border-light)' }}>
                        {section.title}
                      </div>
                      <div className="space-y-1">
                        {section.items.map(template => {
                          const item = form.itens.find(i => i.key === template.key) || template;
                          const isNc = item.item_status === 'NC';
                          return (
                            <div key={template.key} className="flex items-start gap-2 p-1.5 rounded-lg"
                              style={{
                                background: isNc ? 'rgba(239,68,68,0.05)' : 'transparent',
                              }}>
                              <span className="text-[10px] font-mono flex-shrink-0 mt-1"
                                style={{ color: 'var(--text-muted)', minWidth: 18 }}>{template.id}</span>
                              <div className="flex gap-1 flex-shrink-0 mt-0.5">
                                {STATUS_OPTIONS.map(opt => {
                                  const active = item.item_status === opt.value;
                                  return (
                                    <button key={opt.value} type="button"
                                      onClick={() => handleItemStatus(template.key, opt.value)}
                                      className="px-1.5 py-0.5 rounded border-none cursor-pointer transition-all text-[11px] font-bold"
                                      style={{
                                        background: active ? opt.color : 'transparent',
                                        color: active ? '#fff' : opt.color,
                                        border: active ? 'none' : `1px solid ${opt.color}`,
                                        opacity: active ? 1 : 0.5,
                                      }}>
                                      {opt.label}
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs" style={{ color: 'var(--text-primary)' }}>
                                  {template.label}
                                  {isNc && (
                                    <span className="ml-1 text-[10px] font-semibold" style={{ color: STATUS_NC.color }}>(NC)</span>
                                  )}
                                </div>
                                {isNc && (
                                  <input type="text" placeholder="Observação da não conformidade..."
                                    value={item.observacao || ''}
                                    onChange={e => handleItemObs(template.key, e.target.value)}
                                    className="mt-0.5 w-full px-2 py-0.5 rounded border text-xs outline-none"
                                    style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mb-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex items-center gap-1"><FaCheckCircle size={12} style={{ color: '#22c55e' }} /> {cCount}/{totalItems} Conforme</span>
                  <span className="flex items-center gap-1"><FaExclamationTriangle size={12} style={{ color: '#ef4444' }} /> {ncCount} Não Conforme</span>
                </div>

                <div className="flex flex-col gap-1 mb-4">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Observações</label>
                  <textarea className={inputBase} rows={2} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)', resize: 'vertical' }}
                    value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} />
                </div>

                <div className="flex flex-col gap-1 mb-4">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Status Geral</label>
                  <select className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                    value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="ok">OK</option>
                    <option value="pendente">Pendente</option>
                    <option value="irregular">Irregular</option>
                  </select>
                </div>

                <button type="submit" disabled={saving}
                  className="w-full px-4 py-2.5 rounded-xl font-bold text-sm border-none cursor-pointer transition-opacity disabled:opacity-50"
                  style={{ background: 'var(--orange)', color: '#fff' }}>
                  {saving ? 'Salvando...' : editId ? 'Atualizar Vistoria' : 'Registrar Vistoria'}
                </button>
              </form>
            </div>

            <div>
              <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Histórico</h3>
              {loading ? <Skeleton type="card" rows={3} /> : vistorias.length === 0 ? (
                <div className="p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Nenhuma vistoria registrada para este veículo.
                </div>
              ) : (
                <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                  {vistorias.map(v => {
                    let ncSummary = '';
                    try {
                      const itens = typeof v.itens === 'string' ? JSON.parse(v.itens) : (v.itens || []);
                      const ncs = itens.filter(i => i.item_status === 'NC' || i.item_status === 'irregular');
                      if (ncs.length > 0) ncSummary = `${ncs.length} NC`;
                    } catch {}
                    return (
                      <div key={v.id} className="p-3 rounded-xl border cursor-pointer transition-colors hover:opacity-80"
                        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
                        onClick={() => loadForEdit(v)}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase px-1.5 py-0.5 rounded" style={{
                              background: v.tipo === 'saida' ? '#dbeafe' : '#fef3c7',
                              color: v.tipo === 'saida' ? '#2563eb' : '#d97706',
                            }}>{v.tipo}</span>
                            <StatusBadge status={v.status} />
                            {ncSummary && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                style={{ background: '#fef2f2', color: '#ef4444' }}>{ncSummary}</span>
                            )}
                          </div>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(v.data)}</span>
                        </div>
                        <div className="flex gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <span>{v.km ? `${v.km} km` : '—'}</span>
                          {v.motorista_nome && <span>{v.motorista_nome}</span>}
                        </div>
                        {v.observacoes && (
                          <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>{v.observacoes}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
