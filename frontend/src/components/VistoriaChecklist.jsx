import React, { useState, useEffect } from 'react';
import { fetchListPaginated, createItem, updateItem } from '../api/client';
import { useToast } from './Toast';
import Skeleton from './Skeleton';
import { FaCheckCircle, FaExclamationTriangle, FaMinusCircle, FaCamera, FaTrash } from 'react-icons/fa';

const CHECKLIST_ITENS = [
  { key: 'documentos', label: 'Documentos (CRLV)' },
  { key: 'pneus', label: 'Pneus / Estepe / Calibragem' },
  { key: 'iluminacao', label: 'Iluminação (faróis, setas, lanternas)' },
  { key: 'combustivel', label: 'Nível de Combustível' },
  { key: 'oleo_agua', label: 'Óleo / Água / Fluidos' },
  { key: 'limpeza_vidros', label: 'Limpador de Para-brisa' },
  { key: 'sinalizacao', label: 'Sinalização (triângulo, extintor)' },
  { key: 'lataria_vidros', label: 'Lataria / Vidros / Retrovisores' },
  { key: 'limpeza', label: 'Limpeza Interna / Externa' },
  { key: 'freios', label: 'Freios' },
  { key: 'embreagem', label: 'Embreagem / Câmbio' },
  { key: 'bateria', label: 'Bateria' },
  { key: 'ar_condicionado', label: 'Ar Condicionado' },
  { key: 'escapamento', label: 'Escapamento' },
];

const STATUS_OPTIONS = [
  { value: 'ok', label: 'OK', icon: FaCheckCircle, color: '#22c55e' },
  { value: 'irregular', label: 'Irregular', icon: FaExclamationTriangle, color: '#ef4444' },
  { value: 'nao_aplicavel', label: 'N/A', icon: FaMinusCircle, color: '#9ca3af' },
];

const inputBase = 'w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors';

function StatusBadge({ status }) {
  const opt = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  const Icon = opt.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{
      background: status === 'ok' ? '#dcfce7' : status === 'irregular' ? '#fef2f2' : '#f3f4f6',
      color: opt.color,
    }}>
      <Icon size={10} />
      {opt.label}
    </span>
  );
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

  const [form, setForm] = useState({
    data: new Date().toISOString().substring(0, 10),
    tipo: 'saida',
    km: '',
    motorista_nome: '',
    observacoes: '',
    status: 'ok',
    itens: CHECKLIST_ITENS.map(item => ({ ...item, item_status: 'ok', observacao: '' })),
    path_foto: null,
  });

  useEffect(() => {
    fetchListPaginated('/api/veiculos', token)
      .then(r => setVehicles(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
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
    setForm({
      data: formatDate(vistoria.data),
      tipo: vistoria.tipo || 'saida',
      km: vistoria.km || '',
      motorista_nome: vistoria.motorista_nome || '',
      observacoes: vistoria.observacoes || '',
      status: vistoria.status || 'ok',
      itens: (() => {
        try {
          const parsed = typeof vistoria.itens === 'string' ? JSON.parse(vistoria.itens) : (vistoria.itens || []);
          return CHECKLIST_ITENS.map(template => {
            const existing = parsed.find(p => p.key === template.key);
            return existing || { ...template, item_status: 'ok', observacao: '' };
          });
        } catch {
          return CHECKLIST_ITENS.map(item => ({ ...item, item_status: 'ok', observacao: '' }));
        }
      })(),
      path_foto: null,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditId(null);
    setForm({
      data: new Date().toISOString().substring(0, 10),
      tipo: 'saida',
      km: '',
      motorista_nome: '',
      observacoes: '',
      status: 'ok',
      itens: CHECKLIST_ITENS.map(item => ({ ...item, item_status: 'ok', observacao: '' })),
      path_foto: null,
    });
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
        await updateItem('vistorias', editId, body, token);
        toast.success('Vistoria atualizada');
      } else {
        await createItem('vistorias', body, token);
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

  const irregularCount = form.itens.filter(i => i.item_status === 'irregular').length;
  const okCount = form.itens.filter(i => i.item_status === 'ok').length;

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
          <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
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

                <div className="space-y-2 mb-4">
                  {CHECKLIST_ITENS.map((template) => {
                    const item = form.itens.find(i => i.key === template.key) || template;
                    return (
                      <div key={template.key} className="flex items-start gap-2 p-2 rounded-lg border" style={{
                        borderColor: item.item_status === 'irregular' ? '#fca5a5' : 'var(--border-light)',
                        background: item.item_status === 'irregular' ? 'rgba(239,68,68,0.05)' : 'transparent',
                      }}>
                        <div className="flex gap-1 flex-shrink-0 mt-0.5">
                          {STATUS_OPTIONS.map(opt => {
                            const Icon = opt.icon;
                            const active = item.item_status === opt.value;
                            return (
                              <button key={opt.value} type="button" onClick={() => handleItemStatus(template.key, opt.value)}
                                className="p-1 rounded border-none cursor-pointer transition-colors"
                                style={{ background: active ? opt.color : 'transparent', color: active ? '#fff' : opt.color }}>
                                <Icon size={12} />
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{template.label}</div>
                          {item.item_status === 'irregular' && (
                            <input type="text" placeholder="Observação..." value={item.observacao || ''}
                              onChange={e => handleItemObs(template.key, e.target.value)}
                              className="mt-1 w-full px-2 py-1 rounded border text-xs outline-none"
                              style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3 mb-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex items-center gap-1"><FaCheckCircle size={12} style={{ color: '#22c55e' }} /> {okCount}/{CHECKLIST_ITENS.length}</span>
                  <span className="flex items-center gap-1"><FaExclamationTriangle size={12} style={{ color: '#ef4444' }} /> {irregularCount} irregular(is)</span>
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
                  {vistorias.map(v => (
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
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
