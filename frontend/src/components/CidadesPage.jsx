import React, { useState, useMemo, useEffect } from 'react';
import GenericModule from './GenericModule';
import { fetchList } from '../api/client';

export default function CidadesPage({ moduleConfig, token, vehicles, cidades: cidadesList }) {
  const [selectedCidade, setSelectedCidade] = useState(null);
  const [cnhs, setCnhs] = useState([]);

  useEffect(() => {
    fetchList('/api/cnhs', token).then((data) => {
      if (Array.isArray(data)) setCnhs(data);
    }).catch(() => {});
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
      if (drivers.length === 0) {
        rows.push({ vehicle: v, driver: null });
      } else {
        for (const d of drivers) {
          rows.push({ vehicle: v, driver: d });
        }
      }
    }
    return rows;
  }, [relatedVehicles, cnhs]);

  const handleSelectChange = (item) => {
    setSelectedCidade(item);
  };

  return (
    <div>
      <GenericModule
        moduleConfig={moduleConfig}
        token={token}
        vehicles={vehicles}
        cidades={cidadesList}
        onItemSelect={handleSelectChange}
      />
      {selectedCidade && (
        <div className="cidade-detalhes">
          <h3>Detalhes — {selectedCidade.nome}{selectedCidade.uf ? ` (${selectedCidade.uf})` : ''}</h3>

          <div className="cidade-relacionados">
            <div className="cidade-relacionados-card full-width">
              <h4>Veículos e Motoristas ({combinedRows.length})</h4>
              {combinedRows.length === 0 ? (
                <p className="sem-dados">Nenhum veículo cadastrado nesta cidade.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Placa</th>
                      <th>Modelo</th>
                      <th>Número</th>
                      <th>Motorista</th>
                      <th>CPF</th>
                      <th>Validade CNH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combinedRows.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.vehicle.placa}</td>
                        <td>{row.vehicle.fipe_modelo || row.vehicle.tipo || '-'}</td>
                        <td>{row.vehicle.numero || '-'}</td>
                        <td>{row.driver ? row.driver.nome : '-'}</td>
                        <td>{row.driver ? row.driver.cpf || '-' : '-'}</td>
                        <td>{row.driver ? row.driver.validade || '-' : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
