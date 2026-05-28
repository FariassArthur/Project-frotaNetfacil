import React, { useState } from 'react';
import { getFileUrl, getItemValue } from '../api/client';

export default function EntityForm({
  fields,
  formData,
  onChange,
  onSubmit,
  vehicles,
  cidades,
  isNew,
  isSubmitting
}) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const next = {};
    for (const field of fields) {
      if (field.tableOnly) continue;
      if (field.required && !formData[field.name]) {
        next[field.name] = 'Campo obrigatório';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(e);
  };

  const renderField = (field) => {
    const hasError = errors[field.name];
    const value = formData[field.name] || '';

    if (field.name === 'veiculo_id') {
      return (
        <select
          id={field.name}
          className={`form-select${hasError ? ' input-error' : ''}`}
          value={value}
          onChange={(e) => { onChange(field.name, e.target.value); setErrors((p) => ({ ...p, [field.name]: undefined })); }}
        >
          <option value="">-- selecione --</option>
          {vehicles.map((v) => (
            <option key={v.placa} value={v.placa}>
              {v.placa}{v.numero ? ` (${v.numero})` : ''}{v.tipo ? ` - ${v.tipo}` : ''}
            </option>
          ))}
        </select>
      );
    }

    if (field.name === 'cidade_id') {
      return (
        <select
          id={field.name}
          className={`form-select${hasError ? ' input-error' : ''}`}
          value={value}
          onChange={(e) => { onChange(field.name, e.target.value); setErrors((p) => ({ ...p, [field.name]: undefined })); }}
        >
          <option value="">-- selecione --</option>
          {cidades.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.nome}{c.uf ? ` - ${c.uf}` : ''}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === 'file') {
      const existingFile = !isNew ? getItemValue(formData, field.name) : null;
      const hasExistingFile = existingFile && typeof existingFile === 'string';
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="file"
            id={field.name}
            className={`form-input${hasError ? ' input-error' : ''}`}
            onChange={(e) => { onChange(field.name, e.target.files[0]); setErrors((p) => ({ ...p, [field.name]: undefined })); }}
          />
          {hasExistingFile && (
            <a
              href={getFileUrl(existingFile)}
              className="file-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              📎 Arquivo atual
            </a>
          )}
        </div>
      );
    }

    if (field.type === 'select' && field.options) {
      return (
        <select
          id={field.name}
          className={`form-select${hasError ? ' input-error' : ''}`}
          value={value}
          onChange={(e) => { onChange(field.name, e.target.value); setErrors((p) => ({ ...p, [field.name]: undefined })); }}
        >
          <option value="">-- selecione --</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <input
          type="checkbox"
          id={field.name}
          className="form-checkbox"
          checked={value}
          onChange={(e) => onChange(field.name, e.target.checked)}
        />
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          id={field.name}
          className={`form-textarea${hasError ? ' input-error' : ''}`}
          value={value}
          onChange={(e) => { onChange(field.name, e.target.value); setErrors((p) => ({ ...p, [field.name]: undefined })); }}
        />
      );
    }

    return (
      <input
        id={field.name}
        className={`form-input${hasError ? ' input-error' : ''}`}
        type={field.type || 'text'}
        value={value}
        onChange={(e) => { onChange(field.name, e.target.value); setErrors((p) => ({ ...p, [field.name]: undefined })); }}
      />
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        {fields.filter(f => !f.tableOnly).map((field) => (
          <div key={field.name} className="form-group">
            <label className="form-label" htmlFor={field.name}>
              {field.label}
              {field.required ? ' *' : ''}
            </label>
            {renderField(field)}
            {errors[field.name] && <span className="field-error">{errors[field.name]}</span>}
          </div>
        ))}
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : isNew ? 'Criar' : 'Atualizar'}
        </button>
      </div>
    </form>
  );
}
