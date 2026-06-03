import React, { useState } from 'react';
import { FaUpload, FaCheckCircle, FaExclamationCircle, FaDownload, FaEye, FaArrowRight, FaTimesCircle } from 'react-icons/fa';
import { apiBase } from '../api/client';

const TABELAS = [
  { key: 'veiculos', label: 'Veículos' },
  { key: 'cnhs', label: 'Motoristas (CNH)' },
  { key: 'manutencoes', label: 'Manutenções' },
  { key: 'multas', label: 'Multas' },
  { key: 'abastecimentos', label: 'Abastecimentos' },
  { key: 'mecanicas', label: 'Mecânicas' },
  { key: 'cidades', label: 'Cidades' },
];

const STEP = { UPLOAD: 1, PREVIEW: 2, RESULT: 3 };

export default function ImportarCSV({ token }) {
  const [tabela, setTabela] = useState('veiculos');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(STEP.UPLOAD);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const reset = () => {
    setStep(STEP.UPLOAD);
    setPreview(null);
    setResult(null);
    setError('');
    setFile(null);
  };

  const handlePreview = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError('');
    setPreview(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tabela', tabela);
    try {
      const r = await fetch(`${apiBase}/api/importar/csv/preview`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const d = await r.json();
      if (d.error) {
        setError(d.error);
      } else {
        setPreview(d);
        setStep(STEP.PREVIEW);
      }
    } catch (err) {
      setError('Erro ao processar preview: ' + err.message);
    }
    setLoading(false);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tabela', tabela);
    try {
      const r = await fetch(`${apiBase}/api/importar/csv`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const d = await r.json();
      if (d.error) {
        setError(d.error);
      } else {
        setResult(d);
        setStep(STEP.RESULT);
      }
    } catch (err) {
      setError('Erro ao importar: ' + err.message);
    }
    setLoading(false);
  };

  const downloadModelo = () => {
    const a = document.createElement('a');
    a.href = `${apiBase}/api/importar/csv/modelo/${tabela}`;
    a.download = `modelo_${tabela}.csv`;
    a.click();
  };

  const renderUpload = () => (
    <form onSubmit={handlePreview} className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Tabela de destino</label>
        <select value={tabela} onChange={e => { setTabela(e.target.value); setError(''); }}
          className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
          style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}>
          {TABELAS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
        <div className="flex items-center gap-2 mt-1">
          <button type="button" onClick={downloadModelo}
            className="text-xs px-3 py-1.5 rounded-lg border-none cursor-pointer inline-flex items-center gap-1.5 font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--orange-bg)', color: 'var(--orange-dark)' }}>
            <FaDownload size={10} /> Baixar modelo com exemplo
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Arquivo CSV</label>
        <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])}
          className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-none file:text-xs file:font-semibold file:cursor-pointer"
          style={{
            background: 'var(--input-bg)',
            borderColor: 'var(--input-border)',
            color: 'var(--text-primary)',
          }} />
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          Formatos aceitos: .csv (valores separados por vírgula)
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm border" style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fca5a5' }}>
          <FaExclamationCircle className="inline mr-1" /> {error}
        </div>
      )}

      <button type="submit" disabled={!file || loading}
        className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white border-none cursor-pointer shadow-lg disabled:opacity-50 inline-flex items-center gap-2 transition-opacity"
        style={{ background: 'var(--orange)' }}>
        <FaEye size={14} /> {loading ? 'Analisando...' : 'Visualizar Preview'}
      </button>
    </form>
  );

  const renderPreview = () => {
    if (!preview) return null;
    const hasMappingIssues = preview.campos_ignorados?.length > 0 || preview.campos_nao_encontrados?.length > 0;

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <FaEye size={20} style={{ color: 'var(--orange)' }} />
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Preview da Importação</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {preview.total_linhas} linha(s) encontrada(s) — revise o mapeamento antes de importar
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
          <h4 className="text-xs font-bold uppercase mb-3" style={{ color: 'var(--text-secondary)' }}>Mapeamento de Colunas</h4>
          {Object.entries(preview.mapeamento).map(([header, mapped]) => (
            <div key={header} className="flex items-center gap-2 py-1.5 border-b text-xs" style={{ borderColor: 'var(--border-light)' }}>
              <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)', minWidth: 180 }}>{header}</span>
              <FaArrowRight size={9} style={{ color: 'var(--text-muted)' }} />
              {mapped ? (
                <span className="font-mono px-1.5 py-0.5 rounded" style={{ background: '#dcfce7', color: '#16a34a' }}>{mapped}</span>
              ) : (
                <span className="font-mono px-1.5 py-0.5 rounded flex items-center gap-1" style={{ background: '#fef2f2', color: '#dc2626' }}>
                  <FaTimesCircle size={9} /> ignorado
                </span>
              )}
            </div>
          ))}
        </div>

        {hasMappingIssues && (
          <div className="flex gap-4 text-xs">
            {preview.campos_ignorados?.length > 0 && (
              <div className="p-3 rounded-lg border flex-1" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#dc2626' }}>
                <strong>{preview.campos_ignorados.length} coluna(s) ignorada(s):</strong>{' '}
                {preview.campos_ignorados.join(', ')}
              </div>
            )}
            {preview.campos_nao_encontrados?.length > 0 && (
              <div className="p-3 rounded-lg border flex-1" style={{ background: '#fff7ed', borderColor: '#fed7aa', color: '#c2410c' }}>
                <strong>{preview.campos_nao_encontrados.length} campo(s) não encontrado(s):</strong>{' '}
                {preview.campos_nao_encontrados.join(', ')}
              </div>
            )}
          </div>
        )}

        {preview.amostra?.length > 0 && (
          <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
            <h4 className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>Amostra (primeiras {preview.amostra.length} linhas)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    {preview.campos_mapeados.map(f => (
                      <th key={f} className="text-left px-2 py-1 font-semibold border-b" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-light)' }}>{f}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.amostra.map((row, i) => (
                    <tr key={i}>
                      {preview.campos_mapeados.map(f => (
                        <td key={f} className="px-2 py-1 border-b truncate max-w-[200px]" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-light)' }}>
                          {row[f] || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={reset}
            className="px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: 'transparent', borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}>
            Voltar
          </button>
          <button onClick={handleImport} disabled={loading || preview.campos_mapeados.length === 0}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white border-none cursor-pointer shadow-lg disabled:opacity-50 inline-flex items-center gap-2 transition-opacity"
            style={{ background: 'var(--orange)' }}>
            <FaUpload size={14} /> {loading ? 'Importando...' : `Importar ${preview.total_linhas} linha(s)`}
          </button>
        </div>
      </div>
    );
  };

  const renderResult = () => {
    if (!result) return null;

    return (
      <div className="space-y-4">
        <div className="p-5 rounded-xl border" style={{
          background: result.erros > 0 ? '#fefce8' : '#f0fdf4',
          borderColor: result.erros > 0 ? '#facc15' : '#86efac',
        }}>
          <div className="flex items-center gap-2 mb-3">
            {result.erros > 0 ? (
              <FaExclamationCircle size={20} style={{ color: '#eab308' }} />
            ) : (
              <FaCheckCircle size={20} style={{ color: '#22c55e' }} />
            )}
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              {result.erros > 0 ? 'Importação concluída com ressalvas' : 'Importação concluída com sucesso'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <div className="p-3 rounded-lg border text-center" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
              <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{result.total}</div>
              <div className="text-xs">Total de linhas</div>
            </div>
            <div className="p-3 rounded-lg border text-center" style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
              <div className="font-bold text-lg" style={{ color: '#16a34a' }}>{result.importados}</div>
              <div className="text-xs">Importados</div>
            </div>
            <div className="p-3 rounded-lg border text-center" style={{ background: result.erros > 0 ? '#fef2f2' : '#f9fafb', borderColor: result.erros > 0 ? '#fca5a5' : 'var(--border-light)' }}>
              <div className="font-bold text-lg" style={{ color: result.erros > 0 ? '#dc2626' : 'var(--text-primary)' }}>{result.erros}</div>
              <div className="text-xs">Erros</div>
            </div>
          </div>

          {result.campos_mapeados?.length > 0 && (
            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              Campos mapeados: <strong style={{ color: 'var(--text-secondary)' }}>{result.campos_mapeados.join(', ')}</strong>
            </p>
          )}

          {result.campos_ignorados?.length > 0 && (
            <p className="text-xs mt-1" style={{ color: '#dc2626' }}>
              Colunas ignoradas: {result.campos_ignorados.join(', ')}
            </p>
          )}
        </div>

        {result.detalhes_erros?.length > 0 && (
          <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
            <h4 className="text-xs font-bold uppercase mb-2" style={{ color: '#dc2626' }}>Detalhes dos Erros</h4>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {result.detalhes_erros.map((e, i) => (
                <div key={i} className="text-xs py-0.5 flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-mono flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Linha {e.linha}:</span>
                  <span>{e.motivo}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={reset}
          className="px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer transition-opacity hover:opacity-80"
          style={{ background: 'transparent', borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}>
          Nova Importação
        </button>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <FaUpload style={{ color: 'var(--orange)' }} /> Importar CSV
      </h1>

      {step === STEP.UPLOAD && renderUpload()}
      {step === STEP.PREVIEW && renderPreview()}
      {step === STEP.RESULT && renderResult()}

      {step > STEP.UPLOAD && error && (
        <div className="mt-4 p-3 rounded-lg text-sm border" style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fca5a5' }}>
          <FaExclamationCircle className="inline mr-1" /> {error}
        </div>
      )}
    </div>
  );
}
