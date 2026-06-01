import React, { useState, useMemo, useEffect } from 'react';
import GenericModule from './GenericModule';
import { fetchList } from '../api/client';

export default function CidadesPage({ moduleConfig, token, vehicles, cidades: cidadesList }) {
  const [selectedCidade, setSelectedCidade] = useState(null);
  const [cnhs, setCnhs] = useState([]);

  useEffect(() => {
    fetchList('/api/cnhs', token).then((data) => {
      if (Array.isArray(data)) setCnhs(data);
    }).catch((err) => console.error('Erro ao carregar motoristas:', err));
  }, [token]);

  const relatedVehicles = useMemo(() => {
    if (!selectedCidade) return [];
    return (vehicles || []).filter((v) => String(v.cidade_id) === String(selectedCidade.id));
  }, [selectedCidade, vehicles]);

  const combinedRows = useMemo(() => {
    if (relatedVehicles.length === 0) return [];
    const rows = [];
    for (const v of relatedVehicles) {
      const drivers = cnhs.filter((c) => c.veiculo_id === v.placa);
      if (drivers.length === 0) rows.push({ vehicle: v, driver: null });
      else for (const d of drivers) rows.push({ vehicle: v, driver: d });
    }
    return rows;
  }, [relatedVehicles, cnhs]);

  return (
    <div>
      <GenericModule
        moduleConfig={moduleConfig}
        token={token}
        vehicles={vehicles}
        cidades={cidadesList}
        onItemSelect={(item) => setSelectedCidade(item)}
      />
      {selectedCidade && (
        <div className="rounded-xl border m-6 p-6" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
          <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Detalhes — {selectedCidade.nome}{selectedCidade.uf ? ` (${selectedCidade.uf})` : ''}
          </h3>
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-light)' }}>
            <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Veículos e Motoristas ({combinedRows.length})</h4>
            {combinedRows.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum veículo cadastrado nesta cidade.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr style={{ background: 'var(--table-header-bg)' }}>
                      <th className="px-4 py-3 text-left font-bold border-b" style={{ color: 'var(--text-primary)' }}>Placa</th>
                      <th className="px-4 py-3 text-left font-bold border-b" style={{ color: 'var(--text-primary)' }}>Modelo</th>
                      <th className="px-4 py-3 text-left font-bold border-b" style={{ color: 'var(--text-primary)' }}>Número</th>
                      <th className="px-4 py-3 text-left font-bold border-b" style={{ color: 'var(--text-primary)' }}>Motorista</th>
                      <th className="px-4 py-3 text-left font-bold border-b" style={{ color: 'var(--text-primary)' }}>CPF</th>
                      <th className="px-4 py-3 text-left font-bold border-b" style={{ color: 'var(--text-primary)' }}>Validade CNH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combinedRows.map((row, idx) => (
                      <tr key={idx} className="hover:[background:var(--table-row-hover)]" style={{ color: 'var(--text-secondary)' }}>
                        <td className="px-4 py-3 border-b">{row.vehicle.placa}</td>
                        <td className="px-4 py-3 border-b">{row.vehicle.fipe_modelo || row.vehicle.tipo || '-'}</td>
                        <td className="px-4 py-3 border-b">{row.vehicle.numero || '-'}</td>
                        <td className="px-4 py-3 border-b">{row.driver ? row.driver.nome : '-'}</td>
                        <td className="px-4 py-3 border-b">{row.driver ? row.driver.cpf || '-' : '-'}</td>
                        <td className="px-4 py-3 border-b">{row.driver ? row.driver.validade || '-' : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
