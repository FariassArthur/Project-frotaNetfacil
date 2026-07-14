import React, { useState, useEffect } from 'react';
import { apiBase, fetchList, createItem, updateItem, deleteItem, fetchOptions, getHeaders } from '../api/client';
import { useToast } from './Toast';

const inputBase = 'w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors';

export default function ManutencaoPreventivaConfig({ token, veiculoId, veiculos }) {
  const toast = useToast();
  const [configs, setConfigs] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    veiculo_id: veiculoId || '',
    tipo_manutencao_id: '',
    descricao: '',
    km_intervalo: '',
    km_proxima: '',
    meses_intervalo: '',
    data_proxima: '',
    ativo: true,
  });

  useEffect(() => {
    loadConfigs();
    fetchList('/api/tipo-manutencao', token).then(r => {
      if (Array.isArray(r)) setTipos(r);
    }).catch(err => console.error('Erro ao carregar tipo de manutenção:', err));
  }, [veiculoId]);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const params = veiculoId ? `?veiculo_id=${veiculoId}` : '';
      const data = await fetchList(`/api/manutencao-preventiva/config${params}`, token);
      if (Array.isArray(data)) setConfigs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      veiculo_id: veiculoId || '',
      tipo_manutencao_id: '',
      descricao: '',
      km_intervalo: '',
      km_proxima: '',
      meses_intervalo: '',
      data_proxima: '',
      ativo: true,
    });
    setEditing(null);
  };

  const handleEdit = (cfg) => {
    setForm({
      veiculo_id: cfg.veiculo_id,
      tipo_manutencao_id: cfg.tipo_manutencao_id || '',
      descricao: cfg.descricao || '',
      km_intervalo: cfg.km_intervalo || '',
      km_proxima: cfg.km_proxima || '',
      meses_intervalo: cfg.meses_intervalo || '',
      data_proxima: cfg.data_proxima || '',
      ativo: !!cfg.ativo,
    });
    setEditing(cfg);
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await updateItem('/api/manutencao-preventiva/config', editing.id, form, token);
        toast.success('Configuração atualizada');
      } else {
        await createItem('/api/manutencao-preventiva/config', form, token);
        toast.success('Configuração criada');
      }
      await loadConfigs();
      setFormOpen(false);
      resetForm();
    } catch (err) {
      toast.error('Erro ao salvar');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cfg) => {
    if (!window.confirm('Deseja excluir esta configuração?')) return;
    setLoading(true);
    try {
      await deleteItem('/api/manutencao-preventiva/config', cfg.id, token);
      toast.success('Configuração excluída');
      await loadConfigs();
    } catch (err) {
      toast.error('Erro ao excluir');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    if (!window.confirm('Confirmar manutenção realizada? As próximas datas/KM serão recalculados.')) return;
    setCheckinLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/manutencao-preventiva/checkin`, {
        method: 'POST',
        headers: getHeaders(token),
        ...fetchOptions(token),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`${data.updated} manutenção(ões) atualizada(s)`);
        await loadConfigs();
      }
    } catch (err) {
      toast.error('Erro ao confirmar manutenção');
    } finally {
      setLoading(false);
    }
  };

  const thClass = 'px-3 py-2 text-left text-xs font-bold border-b whitespace-nowrap';
  const tdClass = 'px-3 py-2 text-xs border-b';

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Configuração de Manutenção Preventiva</h3>
        <div className="flex gap-2">
          {!formOpen && (
            <>
              <button className="px-4 py-2 rounded-[12px] font-semibold text-xs text-white border-none cursor-pointer"
                style={{ background: 'var(--orange)' }}
                onClick={() => { resetForm(); setFormOpen(true); }}>
                + Nova Config
              </button>
              <button className="px-4 py-2 rounded-[12px] font-semibold text-xs text-white border-none cursor-pointer disabled:opacity-60"
                style={{ background: '#28a745' }}
                onClick={handleCheckin}
                disabled={checkinLoading}>
                {checkinLoading ? 'Aguarde...' : '✓ Confirmar Realizadas'}
              </button>
            </>
          )}
        </div>
      </div>

      {!loading && !formOpen && configs.length === 0 && (
        <div className="rounded-xl border px-4 py-6 text-sm text-center" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-muted)' }}>
          Nenhuma configuração cadastrada para este veículo ainda.
        </div>
      )}

      {formOpen && (
        <form onSubmit={handleSubmit} className="p-4 rounded-xl border mb-4"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Veículo</label>
              <select className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                value={form.veiculo_id} onChange={(e) => setForm(p => ({ ...p, veiculo_id: e.target.value }))} required>
                <option value="">Selecione</option>
                {(veiculos || []).map(v => (
                  <option key={v.placa} value={v.placa}>{v.placa} - {v.fipe_modelo || v.tipo || ''}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Tipo Manutenção</label>
              <select className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                value={form.tipo_manutencao_id} onChange={(e) => setForm(p => ({ ...p, tipo_manutencao_id: e.target.value }))}>
                <option value="">Selecione</option>
                {tipos.map(t => (
                  <option key={t.id} value={t.id}>{t.descricao}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Descrição</label>
              <input className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                value={form.descricao} onChange={(e) => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Ex: Troca de óleo" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Intervalo KM</label>
              <input type="number" className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                value={form.km_intervalo} onChange={(e) => setForm(p => ({ ...p, km_intervalo: e.target.value }))} placeholder="Ex: 10000" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Próximo KM</label>
              <input type="number" className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                value={form.km_proxima} onChange={(e) => setForm(p => ({ ...p, km_proxima: e.target.value }))} placeholder="Ex: 50000" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Intervalo Meses</label>
              <input type="number" className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                value={form.meses_intervalo} onChange={(e) => setForm(p => ({ ...p, meses_intervalo: e.target.value }))} placeholder="Ex: 12" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Próxima Data</label>
              <input type="date" className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                value={form.data_proxima} onChange={(e) => setForm(p => ({ ...p, data_proxima: e.target.value }))} />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={form.ativo} onChange={(e) => setForm(p => ({ ...p, ativo: e.target.checked }))} />
                Ativo
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-[12px] font-semibold text-xs text-white border-none cursor-pointer"
              style={{ background: 'var(--orange)' }} disabled={loading}>
              {editing ? 'Atualizar' : 'Salvar'}
            </button>
            <button type="button" className="px-4 py-2 rounded-[12px] font-semibold text-xs border-none cursor-pointer"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              onClick={() => { setFormOpen(false); resetForm(); }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading && !formOpen ? (
        <div className="flex items-center gap-2 py-8 justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
          <span className="inline-block w-4 h-4 border-2 border-[var(--orange)] border-t-transparent rounded-full animate-[spin_0.6s_linear_infinite]" />
          Carregando...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-light)' }}>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr style={{ background: 'var(--table-header-bg)' }}>
                <th className={thClass}>Veículo</th>
                <th className={thClass}>Tipo</th>
                <th className={thClass}>Descrição</th>
                <th className={thClass}>Intervalo KM</th>
                <th className={thClass}>Próx. KM</th>
                <th className={thClass}>KM Atual</th>
                <th className={thClass}>Meses</th>
                <th className={thClass}>Próx. Data</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {configs.length === 0 ? (
                <tr><td className="text-center py-8" style={{ color: 'var(--text-muted)' }} colSpan={10}>Nenhuma configuração encontrada</td></tr>
              ) : configs.map((cfg) => {
                const pendente = (cfg.km_atual >= cfg.km_proxima) || (cfg.data_proxima && cfg.data_proxima <= new Date().toISOString().slice(0, 10));
                return (
                  <tr key={cfg.id} style={{ color: 'var(--text-secondary)', background: pendente ? 'rgba(255,0,0,0.04)' : undefined }}>
                    <td className={tdClass}>{cfg.placa || cfg.veiculo_id}</td>
                    <td className={tdClass}>{cfg.tipo_descricao || '-'}</td>
                    <td className={tdClass}>{cfg.descricao || '-'}</td>
                    <td className={tdClass}>{cfg.km_intervalo ? cfg.km_intervalo.toLocaleString('pt-BR') : '-'}</td>
                    <td className={tdClass} style={{ fontWeight: pendente ? 700 : undefined, color: pendente ? 'var(--danger)' : undefined }}>
                      {cfg.km_proxima ? cfg.km_proxima.toLocaleString('pt-BR') : '-'}
                    </td>
                    <td className={tdClass}>{cfg.km_atual ? cfg.km_atual.toLocaleString('pt-BR') : '-'}</td>
                    <td className={tdClass}>{cfg.meses_intervalo || '-'}</td>
                    <td className={tdClass} style={{ color: pendente && cfg.data_proxima ? 'var(--danger)' : undefined }}>
                      {cfg.data_proxima || '-'}
                    </td>
                    <td className={tdClass}>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold`}
                        style={{
                          background: cfg.ativo ? (pendente ? 'var(--danger-bg)' : 'var(--success-bg)') : 'var(--bg-secondary)',
                          color: cfg.ativo ? (pendente ? 'var(--danger)' : 'var(--success)') : 'var(--text-muted)',
                        }}>
                        {cfg.ativo ? (pendente ? 'Pendente' : 'OK') : 'Inativo'}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <div className="flex gap-1">
                        <button className="px-2 py-1 rounded text-xs font-semibold border-none cursor-pointer"
                          style={{ background: 'var(--orange-bg)', color: 'var(--orange-dark)' }}
                          onClick={() => handleEdit(cfg)}>Editar</button>
                        <button className="px-2 py-1 rounded text-xs font-semibold border-none cursor-pointer"
                          style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
                          onClick={() => handleDelete(cfg)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
