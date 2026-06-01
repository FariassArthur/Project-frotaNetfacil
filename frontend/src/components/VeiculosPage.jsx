import React, { useState, useEffect } from 'react';
import GenericModule from './GenericModule';
import VeiculoGastos from './VeiculoGastos';
import { getByKey } from '../modules/config';

const SUB_TABS = [
  { key: 'cadastro', label: 'Cadastro' },
  { key: 'gastos', label: 'Gastos' },
  { key: 'cnhs', label: 'Motoristas' },
  { key: 'manutencoes', label: 'Manutenções' },
  { key: 'multas', label: 'Multas' },
  { key: 'abastecimentos', label: 'Abastecimentos' },
  { key: 'contratos-seguro', label: 'Contratos Seguro' },
  { key: 'pagamentos-seguro', label: 'Pag. Seguro' },
  { key: 'documentos', label: 'Pag. Documentos' },
  { key: 'higienizacao', label: 'Higienização' },
];

const MODULE_KEY_MAP = {
  cnhs: 'cnhs',
  manutencoes: 'manutencoes',
  multas: 'multas',
  abastecimentos: 'abastecimentos',
  'contratos-seguro': 'contratos-seguro',
  'pagamentos-seguro': 'pagamentos-seguro',
  documentos: 'pagamento-documentos',
  higienizacao: 'higienizacao',
};

export default function VeiculosPage({ moduleConfig, token, vehicles, cidades }) {
  const [activeTab, setActiveTab] = useState('cadastro');
  const [selectedVehicle, setSelectedVehicle] = useState('');

  const needsVehicle = !['cadastro', 'gastos'].includes(activeTab);

  const [animKey, setAnimKey] = useState('cadastro');
  useEffect(() => {
    setAnimKey(activeTab);
  }, [activeTab]);

  const renderContent = () => {
    if (activeTab === 'cadastro') {
      return <GenericModule moduleConfig={moduleConfig} token={token} vehicles={vehicles} cidades={cidades} />;
    }
    if (activeTab === 'gastos') {
      return <VeiculoGastos token={token} />;
    }
    if (!selectedVehicle) {
      return (
        <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Selecione um veículo para ver os registros.
        </div>
      );
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
        filterParams={{ veiculo_id: selectedVehicle }}
      />
    );
  };

  const inputBase = 'w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors';

  return (
    <div>
      <div className="flex items-center gap-4 p-4 border-b flex-wrap" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
        <div className="flex flex-col gap-1 min-w-[200px]">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Veículo</label>
          <select
            className={inputBase}
            style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
          >
            <option value="">Selecione um veículo</option>
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

      <div key={animKey} className="transition-opacity duration-200 ease-in">
        {renderContent()}
      </div>
    </div>
  );
}
