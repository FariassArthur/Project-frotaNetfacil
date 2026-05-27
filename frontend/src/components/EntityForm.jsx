import React from 'react';
import { getFileUrl, getItemValue } from '../api/client';

export default function EntityForm({
  fields,
  formData,
  onChange,
  onSubmit,
  vehicles,
  isNew,
  isSubmitting
}) {
  const renderField = (field) => {
    const value = formData[field.name] || '';

    if (field.name === 'veiculo_id') {
      return (
        <select
          id={field.name}
          className="form-select"
          value={value}
          onChange={(e) => onChange(field.name, e.target.value)}
        >
          <option value="">-- selecione --</option>
          {vehicles.map((v) => (
            <option key={v.placa} value={v.placa}>
              {v.placa} {v.tipo ? ` - ${v.tipo}` : ''}
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
            className="form-input"
            onChange={(e) => onChange(field.name, e.target.files[0])}
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
          className="form-select"
          value={value}
          onChange={(e) => onChange(field.name, e.target.value)}
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
          className="form-textarea"
          value={value}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
      );
    }

    return (
      <input
        id={field.name}
        className="form-input"
        type={field.type || 'text'}
        value={value}
        onChange={(e) => onChange(field.name, e.target.value)}
      />
    );
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="form-grid">
        {fields.map((field) => (
          <div key={field.name} className="form-group">
            <label className="form-label" htmlFor={field.name}>
              {field.label}
              {field.required ? ' *' : ''}
            </label>
            {renderField(field)}
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
