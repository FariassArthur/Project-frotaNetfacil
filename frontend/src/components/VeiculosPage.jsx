import React, { useState } from 'react';
import GenericModule from './GenericModule';
import VeiculoGastos from './VeiculoGastos';

const TABS = [
  { key: 'cadastro', label: 'Cadastro' },
  { key: 'gastos', label: 'Gastos' },
];

export default function VeiculosPage({ moduleConfig, token, vehicles }) {
  const [activeTab, setActiveTab] = useState('cadastro');

  if (activeTab === 'gastos') {
    return (
      <div className="module-container">
        <h2>{moduleConfig.label}</h2>
        <div className="sub-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`sub-tab-btn${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <VeiculoGastos token={token} />
      </div>
    );
  }

  return (
    <>
      <div className="sub-tabs" style={{ padding: '16px 24px 0', background: 'var(--bg-secondary, #fafafa)' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`sub-tab-btn${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <GenericModule moduleConfig={moduleConfig} token={token} vehicles={vehicles} />
    </>
  );
}
