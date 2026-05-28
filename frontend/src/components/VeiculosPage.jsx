import React, { useState } from 'react';
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

  const renderContent = () => {
    if (activeTab === 'cadastro') {
      return <GenericModule moduleConfig={moduleConfig} token={token} vehicles={vehicles} cidades={cidades} />;
    }
    if (activeTab === 'gastos') {
      return (
        <div className="module-container">
          <VeiculoGastos token={token} />
        </div>
      );
    }
    if (!selectedVehicle) {
      return (
        <div className="module-container">
          <p className="gastos-sem-dados">Selecione um veículo para ver os registros.</p>
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

  return (
    <div>
      <div className="veiculo-page-bar">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Veículo</label>
          <select
            className="form-input"
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
