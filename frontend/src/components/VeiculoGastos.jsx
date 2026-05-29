import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fetchList } from '../api/client';

const COLORS = ['#ff7f1e', '#dc3545', '#28a745', '#007bff', '#6f42c1', '#fd7e14'];

const CATEGORY_META = {
  Manutenção: { icon: '🔧', color: '#ff7f1e' },
  Multas: { icon: '⚠️', color: '#dc3545' },
  Abastecimento: { icon: '⛽', color: '#28a745' },
  Seguro: { icon: '🛡️', color: '#007bff' },
  Documentos: { icon: '📄', color: '#6f42c1' },
};

function formatMoney(val) {
  if (val == null || isNaN(val)) return 'R$ 0,00';
  return 'R$ ' + val.toFixed(2).replace('.', ',');
}

function formatDate(d) {
  if (!d) return '-';
  return d.substring(0, 10).split('-').reverse().join('/');
}

function csvEscape(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCSV(filename, headers, rows) {
  const bom = '\uFEFF';
  const lines = [
    headers.join(','),
    ...rows.map(r => r.map(csvEscape).join(',')),
  ];
  const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const CSV_CONFIG = {
  manutencoes: {
    headers: ['Data', 'Descrição', 'Classificação', 'KM', 'Valor'],
    map: (m) => [formatDate(m.data), m.descricao || '-', m.classificacao || '-', m.km ?? '-', rawMoney(m.valor)],
  },
  multas: {
    headers: ['Data', 'Local', 'Status', 'Valor'],
    map: (m) => [formatDate(m.data_ocorrencia), m.local_ocorrencia || '-', m.pagamento_realizado ? 'Pago' : 'Pendente', rawMoney(m.valor)],
  },
  abastecimentos: {
    headers: ['Data', 'Quantidade (L)', 'KM', 'Valor'],
    map: (a) => [formatDate(a.data), a.quantidade ?? '-', a.km ?? '-', rawMoney(a.valor)],
  },
  seguro: {
    headers: ['Data', 'Valor'],
    map: (p) => [formatDate(p.data_pagamento), rawMoney(p.valor)],
  },
  documentos: {
    headers: ['Data', 'Descrição', 'Valor'],
    map: (d) => [formatDate(d.data_pagamento), d.descricao || '-', rawMoney(d.valor)],
  },
};

function rawMoney(val) {
  if (val == null || isNaN(val)) return '0,00';
  return val.toFixed(2).replace('.', ',');
}

function DetailCard({ icon, title, count, color, children, csvKey, csvData, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const cfg = CSV_CONFIG[csvKey];
  const handleDownload = (e) => {
    e.stopPropagation();
    if (!cfg || !csvData) return;
    downloadCSV(`${title}.csv`, cfg.headers, csvData.map(cfg.map));
  };
  return (
    <div className="gastos-card">
      <button
        className="gastos-card-header"
        style={{ '--card-color': color }}
        onClick={() => setOpen(!open)}
      >
        <span className="gastos-card-icon">{icon}</span>
        <span className="gastos-card-title">{title}</span>
        <span className="gastos-card-count">{count} registro(s)</span>
        <span className="gastos-card-dl" onClick={handleDownload} title="Download CSV">⬇</span>
        <span className={`gastos-card-arrow${open ? ' open' : ''}`}>▾</span>
      </button>
      {open && <div className="gastos-card-body">{children}</div>}
    </div>
  );
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
    }).catch((err) => console.error('Erro ao carregar veículos:', err));
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

  const renderCustomLabel = ({ name, value, percent }) => {
    if (percent < 0.05) return null;
    return `${(percent * 100).toFixed(0)}%`;
  };

  const catTotal = (list) => list.reduce((s, i) => s + (parseFloat(i.valor) || 0), 0);

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
                {v.placa}{v.numero ? ` (${v.numero})` : ''} — {v.fipe_modelo || v.tipo || ''}
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
              {data.periodo.inicio
                ? `${formatDate(data.periodo.inicio)} até ${formatDate(data.periodo.fim)}`
                : 'Todo o período'}
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
              <div className="gastos-tabela-header">
                <span className="gastos-dl-btn" onClick={() => {
                  const rows = data.categorias.map(c => [c.categoria, rawMoney(c.valor), (data.total > 0 ? ((c.valor / data.total) * 100).toFixed(1) : '0') + '%']);
                  downloadCSV('resumo_categorias.csv', ['Categoria', 'Valor', '%'], rows);
                }} title="Download CSV">⬇</span>
              </div>
              <table className="gastos-summary-table">
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
                    data.categorias.map((cat) => {
                      const meta = CATEGORY_META[cat.categoria] || {};
                      return (
                        <tr key={cat.categoria}>
                          <td>
                            <span className="gastos-cat-dot" style={{ background: meta.color || '#888' }} />
                            {meta.icon ? `${meta.icon} ` : ''}{cat.categoria}
                          </td>
                          <td className="gastos-valor">{formatMoney(cat.valor)}</td>
                          <td className="gastos-pct">{data.total > 0 ? ((cat.valor / data.total) * 100).toFixed(1) : 0}%</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="gastos-total-row">
                    <td><strong>Total</strong></td>
                    <td className="gastos-valor"><strong>{formatMoney(data.total)}</strong></td>
                    <td className="gastos-pct"><strong>100%</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="gastos-detalhes">
            <h4>Detalhamento</h4>
            <div className="gastos-cards">
              {data.detalhes.manutencoes.length > 0 && (
                <DetailCard icon="🔧" title="Manutenções" count={data.detalhes.manutencoes.length} color="#ff7f1e" csvKey="manutencoes" csvData={data.detalhes.manutencoes} defaultOpen>
                  <table className="gastos-detail-table">
                    <thead>
                      <tr><th>Data</th><th>Descrição</th><th>Classif.</th><th>KM</th><th>Valor</th></tr>
                    </thead>
                    <tbody>
                      {data.detalhes.manutencoes.map((m) => (
                        <tr key={m.id}>
                          <td>{formatDate(m.data)}</td>
                          <td>{m.descricao || '-'}</td>
                          <td><span className={`gastos-class-badge ${m.classificacao === 'corretiva' ? 'badge-corretiva' : 'badge-preventiva'}`}>{m.classificacao || '-'}</span></td>
                          <td>{m.km ? m.km.toLocaleString('pt-BR') : '-'}</td>
                          <td className="gastos-valor">{formatMoney(m.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="gastos-total-row">
                        <td colSpan={4}>Subtotal</td>
                        <td className="gastos-valor">{formatMoney(catTotal(data.detalhes.manutencoes))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </DetailCard>
              )}
              {data.detalhes.multas.length > 0 && (
                <DetailCard icon="⚠️" title="Multas" count={data.detalhes.multas.length} color="#dc3545" csvKey="multas" csvData={data.detalhes.multas}>
                  <table className="gastos-detail-table">
                    <thead>
                      <tr><th>Data</th><th>Local</th><th>Status</th><th>Valor</th></tr>
                    </thead>
                    <tbody>
                      {data.detalhes.multas.map((m) => (
                        <tr key={m.id}>
                          <td>{formatDate(m.data_ocorrencia)}</td>
                          <td>{m.local_ocorrencia || '-'}</td>
                          <td><span className={`gastos-status-badge ${m.pagamento_realizado ? 'badge-pago' : 'badge-pendente'}`}>{m.pagamento_realizado ? 'Pago' : 'Pendente'}</span></td>
                          <td className="gastos-valor">{formatMoney(m.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="gastos-total-row">
                        <td colSpan={3}>Subtotal</td>
                        <td className="gastos-valor">{formatMoney(catTotal(data.detalhes.multas))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </DetailCard>
              )}
              {data.detalhes.abastecimentos.length > 0 && (
                <DetailCard icon="⛽" title="Abastecimentos" count={data.detalhes.abastecimentos.length} color="#28a745" csvKey="abastecimentos" csvData={data.detalhes.abastecimentos}>
                  <table className="gastos-detail-table">
                    <thead>
                      <tr><th>Data</th><th>Qtd (L)</th><th>KM</th><th>Valor</th></tr>
                    </thead>
                    <tbody>
                      {data.detalhes.abastecimentos.map((a) => (
                        <tr key={a.id}>
                          <td>{formatDate(a.data)}</td>
                          <td>{a.quantidade ? a.quantidade.toFixed(1) : '-'}</td>
                          <td>{a.km ? a.km.toLocaleString('pt-BR') : '-'}</td>
                          <td className="gastos-valor">{formatMoney(a.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="gastos-total-row">
                        <td colSpan={3}>Subtotal</td>
                        <td className="gastos-valor">{formatMoney(catTotal(data.detalhes.abastecimentos))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </DetailCard>
              )}
              {data.detalhes.pagamentos_seguro.length > 0 && (
                <DetailCard icon="🛡️" title="Seguro" count={data.detalhes.pagamentos_seguro.length} color="#007bff" csvKey="seguro" csvData={data.detalhes.pagamentos_seguro}>
                  <table className="gastos-detail-table">
                    <thead>
                      <tr><th>Data</th><th>Valor</th></tr>
                    </thead>
                    <tbody>
                      {data.detalhes.pagamentos_seguro.map((p) => (
                        <tr key={p.id}>
                          <td>{formatDate(p.data_pagamento)}</td>
                          <td className="gastos-valor">{formatMoney(p.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="gastos-total-row">
                        <td>Subtotal</td>
                        <td className="gastos-valor">{formatMoney(catTotal(data.detalhes.pagamentos_seguro))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </DetailCard>
              )}
              {data.detalhes.pagamento_documentos.length > 0 && (
                <DetailCard icon="📄" title="Documentos" count={data.detalhes.pagamento_documentos.length} color="#6f42c1" csvKey="documentos" csvData={data.detalhes.pagamento_documentos}>
                  <table className="gastos-detail-table">
                    <thead>
                      <tr><th>Data</th><th>Descrição</th><th>Valor</th></tr>
                    </thead>
                    <tbody>
                      {data.detalhes.pagamento_documentos.map((d) => (
                        <tr key={d.id}>
                          <td>{formatDate(d.data_pagamento)}</td>
                          <td>{d.descricao || '-'}</td>
                          <td className="gastos-valor">{formatMoney(d.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="gastos-total-row">
                        <td colSpan={2}>Subtotal</td>
                        <td className="gastos-valor">{formatMoney(catTotal(data.detalhes.pagamento_documentos))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </DetailCard>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
