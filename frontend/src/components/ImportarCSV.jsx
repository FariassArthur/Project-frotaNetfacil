import React, { useState, useRef } from 'react';
import { FaUpload, FaCheckCircle, FaExclamationCircle, FaDownload } from 'react-icons/fa';

const TABELAS = [
  { key: 'veiculos', label: 'Veículos', fields: 'placa, numero, tipo, fipe_name_marca, fipe_modelo, renavam, km, cor, uf' },
  { key: 'cnhs', label: 'Motoristas (CNH)', fields: 'numero_registro, nome, nascimento, categoria, cpf, validade, emissao, local' },
  { key: 'manutencoes', label: 'Manutenções', fields: 'data, valor, descricao, km, classificacao, veiculo_id' },
  { key: 'multas', label: 'Multas', fields: 'data_ocorrencia, data_vencimento, valor, local_ocorrencia, veiculo_id, motorista_id' },
  { key: 'abastecimentos', label: 'Abastecimentos', fields: 'data, quantidade, valor, km, veiculo_id' },
  { key: 'mecanicas', label: 'Mecânicas', fields: 'nome, endereco, cidade, uf, telefone1, email' },
  { key: 'cidades', label: 'Cidades', fields: 'nome, uf' },
];

export default function ImportarCSV({ token }) {
  const [tabela, setTabela] = useState('veiculos');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tabela', tabela);

    try {
      const r = await fetch('/api/importar/csv', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const d = await r.json();
      if (d.error) setError(d.error);
      else setResult(d);
    } catch (err) {
      setError('Erro ao importar: ' + err.message);
    }
    setLoading(false);
  };

  const downloadModelo = () => {
    const t = TABELAS.find(t => t.key === tabela);
    if (!t) return;
    const bom = '\uFEFF';
    const blob = new Blob([bom + t.fields], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modelo_${tabela}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <FaUpload style={{ color: 'var(--orange)' }} /> Importar CSV
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Tabela de destino</label>
          <select value={tabela} onChange={e => { setTabela(e.target.value); setResult(null); setError(''); }}
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
            style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}>
            {TABELAS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Campos: {TABELAS.find(t => t.key === tabela)?.fields}</span>
            <button type="button" onClick={downloadModelo}
              className="text-xs px-2 py-1 rounded-lg border-none cursor-pointer inline-flex items-center gap-1 font-medium"
              style={{ background: 'var(--orange-bg)', color: 'var(--orange-dark)' }}>
              <FaDownload size={10} /> Modelo CSV
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Arquivo CSV</label>
          <input type="file" accept=".csv" ref={fileRef} onChange={e => setFile(e.target.files[0])}
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
            style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg text-sm border" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
            <FaExclamationCircle className="inline mr-1" /> {error}
          </div>
        )}

        <button type="submit" disabled={!file || loading}
          className="px-6 py-2.5 rounded-[12px] font-semibold text-sm text-white border-none cursor-pointer shadow-lg disabled:opacity-50 inline-flex items-center gap-2"
          style={{ background: 'var(--orange)' }}>
          <FaUpload size={14} /> {loading ? 'Importando...' : 'Importar'}
        </button>
      </form>

      {result && (
        <div className="mt-6 p-4 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--success)' }}>
          <div className="flex items-center gap-2 mb-3">
            <FaCheckCircle style={{ color: 'var(--success)' }} size={20} />
            <span className="font-bold" style={{ color: 'var(--success)' }}>Importação concluída</span>
          </div>
          <div className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>Total de linhas: <strong>{result.total}</strong></p>
            <p>Importados: <strong style={{ color: 'var(--success)' }}>{result.importados}</strong></p>
            {result.erros > 0 && <p>Erros: <strong style={{ color: 'var(--danger)' }}>{result.erros}</strong></p>}
            <p>Campos mapeados: <span style={{ color: 'var(--text-muted)' }}>{result.campos_mapeados?.join(', ') || '—'}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}
