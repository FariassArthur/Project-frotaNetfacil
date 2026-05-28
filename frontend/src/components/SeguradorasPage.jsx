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
    }).catch(() => {});
  }, []);

  const getFilterParams = () => {
    const params = {};
    if (selectedSeguradora && activeTab !== 'cadastro') {
      params.seguradora_id = selectedSeguradora;
    }
    if (selectedVehicle) {
      if (activeTab === 'contratos' || activeTab === 'pagamentos') {
        params.veiculo_id = selectedVehicle;
      }
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

  return (
    <div>
      <div className="veiculo-page-bar">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Seguradora</label>
          <select
            className="form-input"
            value={selectedSeguradora}
            onChange={(e) => setSelectedSeguradora(e.target.value)}
          >
            <option value="">Todas as seguradoras</option>
            {seguradoras.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Veículo</label>
          <select
            className="form-input"
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

      <div className="sub-tabs">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`sub-tab-btn${activeTab === tab.key ? ' active' : ''}`}
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