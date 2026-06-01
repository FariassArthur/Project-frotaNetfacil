import React, { useState, useEffect } from 'react';
import GenericModule from './GenericModule';
import { fetchList } from '../api/client';
import { getByKey } from '../modules/config';

const SUB_TABS = [
  { key: 'cadastro', label: 'Cadastro' },
  { key: 'contratos', label: 'Contratos' },
  { key: 'pagamentos', label: 'Pagamentos' },
];

const MODULE_KEY_MAP = {
  contratos: 'contratos-seguro',
  pagamentos: 'pagamentos-seguro',
};

export default function SeguradorasPage({ moduleConfig, token, vehicles, cidades }) {
  const [activeTab, setActiveTab] = useState('cadastro');
  const [selectedSeguradora, setSelectedSeguradora] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [seguradoras, setSeguradoras] = useState([]);

  useEffect(() => {
    fetchList('/api/seguradoras', token).then((list) => {
      if (Array.isArray(list)) setSeguradoras(list);
    }).catch((err) => console.error('Erro ao carregar seguradoras:', err));
  }, []);

  const getFilterParams = () => {
    const params = {};
    if (selectedSeguradora && activeTab !== 'cadastro') params.seguradora_id = selectedSeguradora;
    if (selectedVehicle) {
      if (activeTab === 'contratos' || activeTab === 'pagamentos') params.veiculo_id = selectedVehicle;
    }
    return Object.keys(params).length > 0 ? params : null;
  };

  const renderContent = () => {
    if (activeTab === 'cadastro') {
      return <GenericModule moduleConfig={moduleConfig} token={token} vehicles={vehicles} cidades={cidades} />;
    }
    const modKey = MODULE_KEY_MAP[activeTab];
    const cfg = getByKey(modKey);
    if (!cfg) return null;
    return (
      <GenericModule
        moduleConfig={cfg}
        token={token}
        vehicles={vehicles}
        cidades={cidades}
        filterParams={getFilterParams()}
      />
    );
  };

  const inputBase = 'w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors';

  return (
    <div>
      <div className="flex items-center gap-4 p-4 border-b flex-wrap" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
        <div className="flex flex-col gap-1 min-w-[200px]">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Seguradora</label>
          <select
            className={inputBase}
            style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            value={selectedSeguradora}
            onChange={(e) => setSelectedSeguradora(e.target.value)}
          >
            <option value="">Todas as seguradoras</option>
            {seguradoras.map((s) => (
              <option key={s.id} value={String(s.id)}>{s.nome}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 min-w-[200px]">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Veículo</label>
          <select
            className={inputBase}
            style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
          >
            <option value="">Todos os veículos</option>
            {vehicles.map((v) => (
              <option key={v.placa} value={v.placa}>
                {v.placa}{v.numero ? ` (${v.numero})` : ''} — {v.fipe_modelo || v.tipo || ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-1 p-2 overflow-x-auto border-b" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 text-sm font-semibold rounded-lg border-none cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === tab.key ? 'text-white' : ''
            }`}
            style={{
              background: activeTab === tab.key ? 'var(--orange)' : 'transparent',
              color: activeTab === tab.key ? 'white' : 'var(--text-secondary)',
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {renderContent()}
    </div>
  );
}
