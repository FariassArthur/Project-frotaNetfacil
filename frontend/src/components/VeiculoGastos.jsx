import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fetchList } from '../api/client';

const COLORS = ['#ff7f1e', '#dc3545', '#28a745', '#007bff', '#6f42c1', '#fd7e14'];
const CATEGORY_LABELS = {
  Manutenção: 'Manutenção',
  Multas: 'Multas',
  Abastecimento: 'Abastecimento',
  Seguro: 'Seguro',
  Documentos: 'Documentos',
};

function formatMoney(val) {
  if (val == null || isNaN(val)) return 'R$ 0,00';
  return 'R$ ' + val.toFixed(2).replace('.', ',');
}

export default function VeiculoGastos({ token }) {
  const [veiculos, setVeiculos] = useState([]);
  const [placa, setPlaca] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchList('/api/veiculos', token).then((list) => {
      if (Array.isArray(list)) setVeiculos(list);
    }).catch(() => {});
  }, []);

  const handleSearch = async () => {
    if (!placa) return;
    setLoading(true);
    setError('');
    setData(null);
    try {
      const params = new URLSearchParams();
      if (dataInicio) params.set('data_inicio', dataInicio);
      if (dataFim) params.set('data_fim', dataFim);
      const result = await fetchList(`/api/gastos/${placa}?${params.toString()}`, token);
      if (result.error) {
        setError(result.error);
      } else {
        setData(result);
      }
    } catch (err) {
      setError('Erro ao carregar gastos');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return d.substring(0, 10);
  };

  const renderCustomLabel = ({ name, value, percent }) => {
    if (percent < 0.05) return null;
    return `${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div className="gastos-container">
      <h3>Gastos por Veículo</h3>

      <div className="gastos-filters">
        <div className="form-group">
          <label className="form-label">Veículo</label>
          <select className="form-input" value={placa} onChange={(e) => setPlaca(e.target.value)}>
            <option value="">Selecione um veículo</option>
            {veiculos.map((v) => (
              <option key={v.placa} value={v.placa}>
                {v.placa} — {v.fipe_modelo || v.tipo || ''}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Data Início</label>
          <input className="form-input" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Data Fim</label>
          <input className="form-input" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={handleSearch} disabled={loading || !placa}>
          {loading ? 'Carregando...' : 'Buscar'}
        </button>
      </div>

      {error && <div className="module-error">{error}</div>}

      {data && (
        <div className="gastos-resultados">
          <div className="gastos-resumo">
            <span className="gastos-veiculo">{data.veiculo.placa} — {data.veiculo.modelo}</span>
            <span className="gastos-periodo">
              {data.periodo.inicio ? `${formatDate(data.periodo.inicio)} até ${formatDate(data.periodo.fim)}` : 'Todo o período'}
            </span>
            <span className="gastos-total">Total: {formatMoney(data.total)}</span>
          </div>

          <div className="gastos-chart-row">
            <div className="gastos-pie-wrapper">
              {data.categorias.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.categorias}
                      dataKey="valor"
                      nameKey="categoria"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={renderCustomLabel}
                    >
                      {data.categorias.map((entry, idx) => (
                        <Cell key={entry.categoria} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatMoney(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="gastos-sem-dados">Nenhum gasto encontrado para o período.</p>
              )}
            </div>

            <div className="gastos-tabela-wrapper">
              <table className="entity-table">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Valor</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.categorias.length === 0 ? (
                    <tr><td colSpan={3}>Nenhum gasto</td></tr>
                  ) : (
                    data.categorias.map((cat) => (
                      <tr key={cat.categoria}>
                        <td>{cat.categoria}</td>
                        <td>{formatMoney(cat.valor)}</td>
                        <td>{data.total > 0 ? ((cat.valor / data.total) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="gastos-total-row">
                    <td><strong>Total</strong></td>
                    <td><strong>{formatMoney(data.total)}</strong></td>
                    <td><strong>100%</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="gastos-detalhes">
            <h4>Detalhamento</h4>
            {data.detalhes.manutencoes.length > 0 && (
              <details className="gastos-detail-section">
                <summary>Manutenções ({data.detalhes.manutencoes.length})</summary>
                <table className="entity-table">
                  <thead>
                    <tr><th>Data</th><th>Descrição</th><th>KM</th><th>Valor</th></tr>
                  </thead>
                  <tbody>
                    {data.detalhes.manutencoes.map((m) => (
                      <tr key={m.id}>
                        <td>{formatDate(m.data)}</td>
                        <td>{m.descricao || '-'}</td>
                        <td>{m.km || '-'}</td>
                        <td>{formatMoney(m.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}
            {data.detalhes.multas.length > 0 && (
              <details className="gastos-detail-section">
                <summary>Multas ({data.detalhes.multas.length})</summary>
                <table className="entity-table">
                  <thead>
                    <tr><th>Data</th><th>Local</th><th>Pago</th><th>Valor</th></tr>
                  </thead>
                  <tbody>
                    {data.detalhes.multas.map((m) => (
                      <tr key={m.id}>
                        <td>{formatDate(m.data_ocorrencia)}</td>
                        <td>{m.local_ocorrencia || '-'}</td>
                        <td>{m.pagamento_realizado ? 'Sim' : 'Não'}</td>
                        <td>{formatMoney(m.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}
            {data.detalhes.abastecimentos.length > 0 && (
              <details className="gastos-detail-section">
                <summary>Abastecimentos ({data.detalhes.abastecimentos.length})</summary>
                <table className="entity-table">
                  <thead>
                    <tr><th>Data</th><th>Quantidade</th><th>KM</th><th>Valor</th></tr>
                  </thead>
                  <tbody>
                    {data.detalhes.abastecimentos.map((a) => (
                      <tr key={a.id}>
                        <td>{formatDate(a.data)}</td>
                        <td>{a.quantidade ? `${a.quantidade}L` : '-'}</td>
                        <td>{a.km || '-'}</td>
                        <td>{formatMoney(a.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}
            {data.detalhes.pagamentos_seguro.length > 0 && (
              <details className="gastos-detail-section">
                <summary>Seguro ({data.detalhes.pagamentos_seguro.length})</summary>
                <table className="entity-table">
                  <thead>
                    <tr><th>Data</th><th>Valor</th></tr>
                  </thead>
                  <tbody>
                    {data.detalhes.pagamentos_seguro.map((p) => (
                      <tr key={p.id}>
                        <td>{formatDate(p.data_pagamento)}</td>
                        <td>{formatMoney(p.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}
            {data.detalhes.pagamento_documentos.length > 0 && (
              <details className="gastos-detail-section">
                <summary>Documentos ({data.detalhes.pagamento_documentos.length})</summary>
                <table className="entity-table">
                  <thead>
                    <tr><th>Data</th><th>Descrição</th><th>Valor</th></tr>
                  </thead>
                  <tbody>
                    {data.detalhes.pagamento_documentos.map((d) => (
                      <tr key={d.id}>
                        <td>{formatDate(d.data_pagamento)}</td>
                        <td>{d.descricao || '-'}</td>
                        <td>{formatMoney(d.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
