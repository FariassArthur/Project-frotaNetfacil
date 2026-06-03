import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FaWrench, FaExclamationTriangle, FaGasPump, FaShieldAlt, FaFile, FaDownload } from 'react-icons/fa';
import { fetchList } from '../api/client';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const COLORS = ['#ff7f1e', '#dc3545', '#28a745', '#007bff', '#6f42c1', '#fd7e14'];

const CATEGORY_META = {
  Manutenção: { icon: FaWrench, color: '#ff7f1e' },
  Multas: { icon: FaExclamationTriangle, color: '#dc3545' },
  Abastecimento: { icon: FaGasPump, color: '#28a745' },
  Seguro: { icon: FaShieldAlt, color: '#007bff' },
  Documentos: { icon: FaFile, color: '#6f42c1' },
};

function formatMoney(val) {
  if (val == null || isNaN(val)) return 'R$ 0,00';
  return 'R$ ' + val.toFixed(2).replace('.', ',');
}

function formatDate(d) {
  if (!d) return '-';
  return d.substring(0, 10).split('-').reverse().join('/');
}

function rawMoney(val) {
  if (val == null || isNaN(val)) return '0,00';
  return val.toFixed(2).replace('.', ',');
}

function csvEscape(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadPDF(title, headers, rows) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);
  doc.autoTable({
    startY: 34,
    head: [headers],
    body: rows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [255, 127, 30] },
  });
  doc.save(`${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

function downloadCSV(filename, headers, rows) {
  const bom = '\uFEFF';
  const lines = [headers.join(','), ...rows.map(r => r.map(csvEscape).join(','))];
  const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const CSV_CONFIG = {
  manutencoes: { headers: ['Data', 'Descrição', 'Classificação', 'KM', 'Valor'], map: (m) => [formatDate(m.data), m.descricao || '-', m.classificacao || '-', m.km ?? '-', rawMoney(m.valor)] },
  multas: { headers: ['Data', 'Local', 'Status', 'Valor'], map: (m) => [formatDate(m.data_ocorrencia), m.local_ocorrencia || '-', m.pagamento_realizado ? 'Pago' : 'Pendente', rawMoney(m.valor)] },
  abastecimentos: { headers: ['Data', 'Quantidade (L)', 'KM', 'Valor'], map: (a) => [formatDate(a.data), a.quantidade ?? '-', a.km ?? '-', rawMoney(a.valor)] },
  seguro: { headers: ['Data', 'Valor'], map: (p) => [formatDate(p.data_pagamento), rawMoney(p.valor)] },
  documentos: { headers: ['Data', 'Descrição', 'Valor'], map: (d) => [formatDate(d.data_pagamento), d.descricao || '-', rawMoney(d.valor)] },
};

function catTotal(list) { return list.reduce((s, i) => s + (parseFloat(i.valor) || 0), 0); }

function DetailCard({ icon, title, count, color, children, csvKey, csvData, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const IconComp = typeof icon === 'function' ? icon : null;
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3 border-none cursor-pointer text-left transition-colors hover:opacity-90"
        style={{ background: color, color: 'white' }}
        onClick={() => setOpen(!open)}
      >
        <span className="text-lg">{IconComp ? <IconComp /> : icon}</span>
        <span className="font-semibold text-sm flex-1">{title}</span>
        <span className="text-xs opacity-80">{count} registro(s)</span>
        <span className="cursor-pointer hover:opacity-80"
          onClick={(e) => {
            e.stopPropagation();
            const cfg = CSV_CONFIG[csvKey];
            if (cfg && csvData) downloadCSV(`${title}.csv`, cfg.headers, csvData.map(cfg.map));
          }}
          title="Download CSV"><FaDownload size={14} /></span>
        <span className={`text-sm transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && <div className="p-4">{children}</div>}
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
    fetchList('/api/veiculos', token).then((list) => { if (Array.isArray(list)) setVeiculos(list); })
      .catch((err) => console.error('Erro ao carregar veículos:', err));
  }, []);

  const handleSearch = async () => {
    if (!placa) return;
    setLoading(true); setError(''); setData(null);
    try {
      const params = new URLSearchParams();
      if (dataInicio) params.set('data_inicio', dataInicio);
      if (dataFim) params.set('data_fim', dataFim);
      const result = await fetchList(`/api/gastos/${placa}?${params.toString()}`, token);
      if (result.error) setError(result.error);
      else setData(result);
    } catch (err) { setError('Erro ao carregar gastos'); }
    finally { setLoading(false); }
  };

  const inputBase = 'w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors';

  const exportFullPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(16);
    doc.text(`Relatório de Gastos - ${data.veiculo.placa}`, 14, y);
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Período: ${data.periodo.inicio ? `${formatDate(data.periodo.inicio)} até ${formatDate(data.periodo.fim)}` : 'Todo o período'}`, 14, y);
    y += 6;
    doc.text(`Total: ${formatMoney(data.total)}`, 14, y);
    y += 12;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Resumo por Categoria', 14, y);
    y += 6;
    const catRows = data.categorias.map(c => [c.categoria, `R$ ${rawMoney(c.valor)}`, (data.total > 0 ? ((c.valor / data.total) * 100).toFixed(1) : '0') + '%']);
    doc.autoTable({
      startY: y,
      head: [['Categoria', 'Valor', '%']],
      body: catRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [255, 127, 30] },
    });
    y = doc.lastAutoTable.finalY + 10;
    const sections = [
      { title: 'Manutenções', key: 'manutencoes', headers: ['Data', 'Descrição', 'Classif.', 'KM', 'Valor'], map: (m) => [formatDate(m.data), m.descricao || '-', m.classificacao || '-', m.km ?? '-', `R$ ${rawMoney(m.valor)}`] },
      { title: 'Multas', key: 'multas', headers: ['Data', 'Local', 'Status', 'Valor'], map: (m) => [formatDate(m.data_ocorrencia), m.local_ocorrencia || '-', m.pagamento_realizado ? 'Pago' : 'Pendente', `R$ ${rawMoney(m.valor)}`] },
      { title: 'Abastecimentos', key: 'abastecimentos', headers: ['Data', 'Qtd (L)', 'KM', 'Valor'], map: (a) => [formatDate(a.data), a.quantidade ? a.quantidade.toFixed(1) : '-', a.km ?? '-', `R$ ${rawMoney(a.valor)}`] },
    ];
    for (const sec of sections) {
      const items = data.detalhes[sec.key];
      if (!items || items.length === 0) continue;
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text(sec.title, 14, y);
      y += 6;
      doc.autoTable({
        startY: y,
        head: [sec.headers],
        body: items.map(sec.map),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [255, 127, 30] },
      });
      y = doc.lastAutoTable.finalY + 8;
    }
    doc.save(`Relatorio_Gastos_${data.veiculo.placa}.pdf`);
  };

  return (
    <div className="p-4" style={{ background: 'var(--bg-primary)' }}>
      <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Gastos por Veículo</h3>

      <div className="flex gap-3 items-end flex-wrap mb-4">
        <div className="flex flex-col gap-1 min-w-[200px]">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Veículo</label>
          <select className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            value={placa} onChange={(e) => setPlaca(e.target.value)}>
            <option value="">Selecione um veículo</option>
            {veiculos.map((v) => (
              <option key={v.placa} value={v.placa}>{v.placa}{v.numero ? ` (${v.numero})` : ''} — {v.fipe_modelo || v.tipo || ''}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Data Início</label>
          <input className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Data Fim</label>
          <input className={inputBase} style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </div>
        <button
          className="px-5 py-2.5 rounded-[12px] font-semibold text-sm text-white border-none cursor-pointer shadow-lg disabled:opacity-60"
          style={{ background: 'var(--orange)', boxShadow: '0 8px 20px rgba(255,125,40,0.2)' }}
          onClick={handleSearch} disabled={loading || !placa}>
          {loading ? 'Carregando...' : 'Buscar'}
        </button>
        {data && (
          <button
            className="px-5 py-2.5 rounded-[12px] font-semibold text-sm text-white border-none cursor-pointer shadow-lg"
            style={{ background: '#28a745', boxShadow: '0 8px 20px rgba(40,167,69,0.2)' }}
            onClick={exportFullPDF}
          >
            <FaFile size={14} className="mr-1" /> PDF Completo
          </button>
        )}
      </div>

      {error && <div className="p-3 rounded-lg text-sm mb-4 border" style={{ background: 'var(--orange-bg)', color: 'var(--danger)', borderColor: 'var(--border-light)' }}>{error}</div>}

      {data && (
        <div>
          <div className="flex items-center gap-4 p-4 rounded-xl border mb-4 flex-wrap" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{data.veiculo.placa} — {data.veiculo.modelo}</span>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {data.periodo.inicio ? `${formatDate(data.periodo.inicio)} até ${formatDate(data.periodo.fim)}` : 'Todo o período'}
            </span>
            <span className="text-sm font-bold" style={{ color: 'var(--orange)' }}>Total: {formatMoney(data.total)}</span>
          </div>

          <div className="flex gap-6 flex-col lg:flex-row mb-6">
            <div className="flex-1 min-h-[300px]">
              {data.categorias.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={data.categorias} dataKey="valor" nameKey="categoria" cx="50%" cy="50%" outerRadius={100}
                      label={({ name, value, percent }) => percent < 0.05 ? null : `${(percent * 100).toFixed(0)}%`}>
                      {data.categorias.map((entry, idx) => <Cell key={entry.categoria} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => formatMoney(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm py-12 text-center" style={{ color: 'var(--text-muted)' }}>Nenhum gasto encontrado para o período.</p>
              )}
            </div>
            <div className="w-full lg:w-auto min-w-[250px] table-responsive-wrap">
              <div className="flex justify-end gap-2 mb-1">
                <span className="text-xs cursor-pointer hover:opacity-80" style={{ color: 'var(--orange)' }}
                  onClick={() => {
                    const rows = data.categorias.map(c => [c.categoria, `R$ ${rawMoney(c.valor)}`, (data.total > 0 ? ((c.valor / data.total) * 100).toFixed(1) : '0') + '%']);
                    downloadPDF(`Resumo_Gastos_${data.veiculo.placa}`, ['Categoria', 'Valor', '%'], rows);
                  }} title="Download PDF"><FaFile size={14} className="mr-1" /> PDF</span>
              </div>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr style={{ background: 'var(--table-header-bg)' }}>
                    <th className="px-3 py-2 text-left font-bold border-b" style={{ color: 'var(--text-primary)' }}>Categoria</th>
                    <th className="px-3 py-2 text-right font-bold border-b" style={{ color: 'var(--text-primary)' }}>Valor</th>
                    <th className="px-3 py-2 text-right font-bold border-b" style={{ color: 'var(--text-primary)' }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.categorias.length === 0 ? (
                    <tr><td className="px-3 py-4 text-center" style={{ color: 'var(--text-muted)' }} colSpan={3}>Nenhum gasto</td></tr>
                  ) : data.categorias.map((cat) => {
                    const meta = CATEGORY_META[cat.categoria] || {};
                    return (
                      <tr key={cat.categoria} style={{ color: 'var(--text-secondary)' }}>
                        <td className="px-3 py-2 border-b flex items-center gap-1.5 text-sm">
                          <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: meta.color || '#888' }} />
                          {meta.icon && <meta.icon size={12} className="mr-1" />}{cat.categoria}
                        </td>
                        <td className="px-3 py-2 border-b text-right font-medium" style={{ color: 'var(--orange)' }}>{formatMoney(cat.valor)}</td>
                        <td className="px-3 py-2 border-b text-right" style={{ color: 'var(--text-muted)' }}>{data.total > 0 ? ((cat.valor / data.total) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ color: 'var(--text-primary)' }}>
                    <td className="px-3 py-2 border-t font-bold">Total</td>
                    <td className="px-3 py-2 border-t text-right font-bold" style={{ color: 'var(--orange)' }}>{formatMoney(data.total)}</td>
                    <td className="px-3 py-2 border-t text-right font-bold">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {data.consumo && data.consumo.media_km_por_litro && (
            <div className="mb-4 p-4 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
              <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                <FaGasPump size={14} className="mr-1" /> Análise de Consumo
              </h4>
              <div className="flex items-center gap-4 mb-3 flex-wrap">
                <div className="px-4 py-3 rounded-lg" style={{ background: 'var(--orange-bg)' }}>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Média</span>
                  <span className="text-xl font-bold block" style={{ color: 'var(--orange)' }}>{data.consumo.media_km_por_litro} km/L</span>
                </div>
              </div>
              {data.consumo.detalhes?.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)' }}>
                        <th className="px-3 py-2 text-left font-bold border-b">Data</th>
                        <th className="px-3 py-2 text-right font-bold border-b">KM Rodados</th>
                        <th className="px-3 py-2 text-right font-bold border-b">Litros</th>
                        <th className="px-3 py-2 text-right font-bold border-b">km/L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.consumo.detalhes.map((c, i) => {
                        const isLow = c.km_por_litro < data.consumo.media_km_por_litro * 0.8;
                        return (
                          <tr key={i} style={{ color: 'var(--text-secondary)', background: isLow ? 'rgba(255,0,0,0.04)' : undefined }}>
                            <td className="px-3 py-2 border-b">{formatDate(c.data)}</td>
                            <td className="px-3 py-2 border-b text-right">{c.km_rodados.toLocaleString('pt-BR')}</td>
                            <td className="px-3 py-2 border-b text-right">{c.litros.toFixed(1)}</td>
                            <td className="px-3 py-2 border-b text-right font-semibold"
                              style={{ color: isLow ? 'var(--danger)' : 'var(--success)' }}>
                              {c.km_por_litro} km/L
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div>
            <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Detalhamento</h4>
            <div className="flex flex-col gap-3">
              {data.detalhes.manutencoes.length > 0 && (
                <DetailCard icon={FaWrench} title="Manutenções" count={data.detalhes.manutencoes.length} color="#ff7f1e" csvKey="manutencoes" csvData={data.detalhes.manutencoes} defaultOpen>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead><tr style={{ background: 'var(--bg-secondary)' }}><th className="px-3 py-2 text-left font-bold border-b">Data</th><th className="px-3 py-2 text-left font-bold border-b">Descrição</th><th className="px-3 py-2 text-left font-bold border-b">Classif.</th><th className="px-3 py-2 text-right font-bold border-b">KM</th><th className="px-3 py-2 text-right font-bold border-b">Valor</th></tr></thead>
                      <tbody>
                        {data.detalhes.manutencoes.map((m) => (
                          <tr key={m.id} style={{ color: 'var(--text-secondary)' }}>
                            <td className="px-3 py-2 border-b">{formatDate(m.data)}</td>
                            <td className="px-3 py-2 border-b">{m.descricao || '-'}</td>
                            <td className="px-3 py-2 border-b"><span className="inline-block px-1.5 py-0.5 rounded text-xs font-semibold" style={{
  background: m.classificacao === 'corretiva' ? 'var(--danger-bg)' : 'var(--success-bg)',
  color: m.classificacao === 'corretiva' ? 'var(--danger)' : 'var(--success)',
}}>{m.classificacao || '-'}</span></td>
                            <td className="px-3 py-2 border-b text-right">{m.km ? m.km.toLocaleString('pt-BR') : '-'}</td>
                            <td className="px-3 py-2 border-b text-right font-medium" style={{ color: 'var(--orange)' }}>{formatMoney(m.valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ color: 'var(--text-primary)' }}><td className="px-3 py-2 border-t font-bold" colSpan={4}>Subtotal</td><td className="px-3 py-2 border-t text-right font-bold" style={{ color: 'var(--orange)' }}>{formatMoney(catTotal(data.detalhes.manutencoes))}</td></tr>
                      </tfoot>
                    </table>
                  </div>
                </DetailCard>
              )}
              {data.detalhes.multas.length > 0 && (
                <DetailCard icon={FaExclamationTriangle} title="Multas" count={data.detalhes.multas.length} color="#dc3545" csvKey="multas" csvData={data.detalhes.multas}>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead><tr style={{ background: 'var(--bg-secondary)' }}><th className="px-3 py-2 text-left font-bold border-b">Data</th><th className="px-3 py-2 text-left font-bold border-b">Local</th><th className="px-3 py-2 text-left font-bold border-b">Status</th><th className="px-3 py-2 text-right font-bold border-b">Valor</th></tr></thead>
                      <tbody>
                        {data.detalhes.multas.map((m) => (
                          <tr key={m.id} style={{ color: 'var(--text-secondary)' }}>
                            <td className="px-3 py-2 border-b">{formatDate(m.data_ocorrencia)}</td>
                            <td className="px-3 py-2 border-b">{m.local_ocorrencia || '-'}</td>
                            <td className="px-3 py-2 border-b"><span className="inline-block px-1.5 py-0.5 rounded text-xs font-semibold" style={{
  background: m.pagamento_realizado ? 'var(--success-bg)' : 'var(--warning-bg)',
  color: m.pagamento_realizado ? 'var(--success)' : '#b8860b',
}}>{m.pagamento_realizado ? 'Pago' : 'Pendente'}</span></td>
                            <td className="px-3 py-2 border-b text-right font-medium" style={{ color: 'var(--orange)' }}>{formatMoney(m.valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ color: 'var(--text-primary)' }}><td className="px-3 py-2 border-t font-bold" colSpan={3}>Subtotal</td><td className="px-3 py-2 border-t text-right font-bold" style={{ color: 'var(--orange)' }}>{formatMoney(catTotal(data.detalhes.multas))}</td></tr>
                      </tfoot>
                    </table>
                  </div>
                </DetailCard>
              )}
              {data.detalhes.abastecimentos.length > 0 && (
                <DetailCard icon={FaGasPump} title="Abastecimentos" count={data.detalhes.abastecimentos.length} color="#28a745" csvKey="abastecimentos" csvData={data.detalhes.abastecimentos}>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead><tr style={{ background: 'var(--bg-secondary)' }}><th className="px-3 py-2 text-left font-bold border-b">Data</th><th className="px-3 py-2 text-right font-bold border-b">Qtd (L)</th><th className="px-3 py-2 text-right font-bold border-b">KM</th><th className="px-3 py-2 text-right font-bold border-b">Valor</th></tr></thead>
                      <tbody>
                        {data.detalhes.abastecimentos.map((a) => (
                          <tr key={a.id} style={{ color: 'var(--text-secondary)' }}>
                            <td className="px-3 py-2 border-b">{formatDate(a.data)}</td>
                            <td className="px-3 py-2 border-b text-right">{a.quantidade ? a.quantidade.toFixed(1) : '-'}</td>
                            <td className="px-3 py-2 border-b text-right">{a.km ? a.km.toLocaleString('pt-BR') : '-'}</td>
                            <td className="px-3 py-2 border-b text-right font-medium" style={{ color: 'var(--orange)' }}>{formatMoney(a.valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ color: 'var(--text-primary)' }}><td className="px-3 py-2 border-t font-bold" colSpan={3}>Subtotal</td><td className="px-3 py-2 border-t text-right font-bold" style={{ color: 'var(--orange)' }}>{formatMoney(catTotal(data.detalhes.abastecimentos))}</td></tr>
                      </tfoot>
                    </table>
                  </div>
                </DetailCard>
              )}
              {data.detalhes.pagamentos_seguro.length > 0 && (
                <DetailCard icon={FaShieldAlt} title="Seguro" count={data.detalhes.pagamentos_seguro.length} color="#007bff" csvKey="seguro" csvData={data.detalhes.pagamentos_seguro}>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead><tr style={{ background: 'var(--bg-secondary)' }}><th className="px-3 py-2 text-left font-bold border-b">Data</th><th className="px-3 py-2 text-right font-bold border-b">Valor</th></tr></thead>
                      <tbody>
                        {data.detalhes.pagamentos_seguro.map((p) => (
                          <tr key={p.id} style={{ color: 'var(--text-secondary)' }}>
                            <td className="px-3 py-2 border-b">{formatDate(p.data_pagamento)}</td>
                            <td className="px-3 py-2 border-b text-right font-medium" style={{ color: 'var(--orange)' }}>{formatMoney(p.valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ color: 'var(--text-primary)' }}><td className="px-3 py-2 border-t font-bold">Subtotal</td><td className="px-3 py-2 border-t text-right font-bold" style={{ color: 'var(--orange)' }}>{formatMoney(catTotal(data.detalhes.pagamentos_seguro))}</td></tr>
                      </tfoot>
                    </table>
                  </div>
                </DetailCard>
              )}
              {data.detalhes.pagamento_documentos.length > 0 && (
                <DetailCard icon={FaFile} title="Documentos" count={data.detalhes.pagamento_documentos.length} color="#6f42c1" csvKey="documentos" csvData={data.detalhes.pagamento_documentos}>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead><tr style={{ background: 'var(--bg-secondary)' }}><th className="px-3 py-2 text-left font-bold border-b">Data</th><th className="px-3 py-2 text-left font-bold border-b">Descrição</th><th className="px-3 py-2 text-right font-bold border-b">Valor</th></tr></thead>
                      <tbody>
                        {data.detalhes.pagamento_documentos.map((d) => (
                          <tr key={d.id} style={{ color: 'var(--text-secondary)' }}>
                            <td className="px-3 py-2 border-b">{formatDate(d.data_pagamento)}</td>
                            <td className="px-3 py-2 border-b">{d.descricao || '-'}</td>
                            <td className="px-3 py-2 border-b text-right font-medium" style={{ color: 'var(--orange)' }}>{formatMoney(d.valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ color: 'var(--text-primary)' }}><td className="px-3 py-2 border-t font-bold" colSpan={2}>Subtotal</td><td className="px-3 py-2 border-t text-right font-bold" style={{ color: 'var(--orange)' }}>{formatMoney(catTotal(data.detalhes.pagamento_documentos))}</td></tr>
                      </tfoot>
                    </table>
                  </div>
                </DetailCard>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
