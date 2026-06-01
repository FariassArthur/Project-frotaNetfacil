import React, { useState, useRef, useEffect } from 'react';
import { FaPaperclip } from 'react-icons/fa';
import { getFileUrl, getItemValue } from '../api/client';

export default function EntityForm({
  fields,
  formData,
  onChange,
  onSubmit,
  onCancel,
  vehicles,
  cidades,
  isNew,
  isSubmitting
}) {
  const [errors, setErrors] = useState({});
  const firstFieldRef = useRef(null);

  const visibleFields = fields.filter(f => !f.tableOnly);
  useEffect(() => {
    if (firstFieldRef.current) {
      const el = firstFieldRef.current;
      if (typeof el.focus === 'function') {
        setTimeout(() => el.focus(), 50);
      }
    }
  }, []);

  const validateField = (name, value) => {
    const field = fields.find((f) => f.name === name);
    if (!field) return '';
    if (field.required && !value) return 'Campo obrigatório';
    if (field.type === 'number' || field.type === 'float') {
      const num = Number(value);
      if (field.min !== undefined && num < field.min) return `Mínimo: ${field.min}`;
      if (field.max !== undefined && num > field.max) return `Máximo: ${field.max}`;
    }
    return '';
  };

  const validate = () => {
    const next = {};
    for (const field of visibleFields) {
      const err = validateField(field.name, formData[field.name]);
      if (err) next[field.name] = err;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(e);
  };

  const handleBlur = (name) => {
    setErrors((prev) => {
      const err = validateField(name, formData[name]);
      if (err) return { ...prev, [name]: err };
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const inputBase = 'w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors';
  const labelBase = 'text-sm font-medium';

  const setRef = (field, el) => {
    if (field === visibleFields[0] && el) {
      firstFieldRef.current = el;
    }
  };

  const renderField = (field) => {
    const hasError = errors[field.name];
    const value = formData[field.name] || '';
    const inpStyle = {
      background: 'var(--input-bg)',
      borderColor: hasError ? 'var(--danger)' : 'var(--input-border)',
      color: 'var(--text-primary)',
    };

    if (field.name === 'veiculo_id') {
      return (
        <select
          ref={(el) => setRef(field, el)}
          id={field.name}
          className={inputBase}
          style={inpStyle}
          value={value}
          onBlur={() => handleBlur(field.name)}
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
          ref={(el) => setRef(field, el)}
          id={field.name}
          className={inputBase}
          style={inpStyle}
          value={value}
          onBlur={() => handleBlur(field.name)}
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
        <div className="flex flex-col gap-2">
          <input
            ref={(el) => setRef(field, el)}
            type="file"
            id={field.name}
            className={inputBase}
            style={inpStyle}
            onChange={(e) => { onChange(field.name, e.target.files[0]); setErrors((p) => ({ ...p, [field.name]: undefined })); }}
          />
          {hasExistingFile && (
            <a
              href={getFileUrl(existingFile)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-semibold no-underline transition-colors w-fit"
              style={{
                background: 'var(--orange-bg)',
                color: 'var(--orange-dark)',
                border: '1px solid var(--border-light)',
              }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaPaperclip size={12} className="mr-1" /> Arquivo atual
            </a>
          )}
        </div>
      );
    }

    if (field.type === 'select' && field.options) {
      return (
        <select
          ref={(el) => setRef(field, el)}
          id={field.name}
          className={inputBase}
          style={inpStyle}
          value={value}
          onBlur={() => handleBlur(field.name)}
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
          ref={(el) => setRef(field, el)}
          type="checkbox"
          id={field.name}
          className="w-4 h-4 accent-[var(--orange)]"
          checked={value}
          onChange={(e) => onChange(field.name, e.target.checked)}
        />
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          ref={(el) => setRef(field, el)}
          id={field.name}
          className={inputBase}
          style={{ ...inpStyle, minHeight: 80 }}
          value={value}
          onBlur={() => handleBlur(field.name)}
          onChange={(e) => { onChange(field.name, e.target.value); setErrors((p) => ({ ...p, [field.name]: undefined })); }}
        />
      );
    }

    const isNumber = field.type === 'number' || field.type === 'float';

    return (
      <input
        ref={(el) => setRef(field, el)}
        id={field.name}
        className={inputBase}
        style={inpStyle}
        type={isNumber ? 'number' : field.type || 'text'}
        value={value}
        min={isNumber ? field.min : undefined}
        max={isNumber ? field.max : undefined}
        step={isNumber ? field.step || (field.type === 'float' ? '0.01' : '1') : undefined}
        onBlur={() => handleBlur(field.name)}
        onChange={(e) => { onChange(field.name, e.target.value); setErrors((p) => ({ ...p, [field.name]: undefined })); }}
      />
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4">
        {visibleFields.map((field) => (
          <div key={field.name} className="flex flex-col gap-1.5">
            <label className={labelBase} style={{ color: 'var(--text-secondary)' }} htmlFor={field.name}>
              {field.label}
              {field.required ? ' *' : ''}
            </label>
            {renderField(field)}
            {errors[field.name] && (
              <span className="text-xs" style={{ color: 'var(--danger)' }} role="alert">{errors[field.name]}</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-[12px] font-semibold text-sm text-white border-none cursor-pointer shadow-lg disabled:opacity-60"
          style={{
            background: 'var(--orange)',
            boxShadow: '0 8px 20px rgba(255, 125, 40, 0.2)',
          }}
        >
          {isSubmitting ? 'Salvando...' : isNew ? 'Criar' : 'Atualizar'}
        </button>
        {onCancel && (
          <button
            type="button"
            className="px-5 py-2.5 rounded-[12px] font-semibold text-sm border cursor-pointer"
            style={{
              background: 'var(--orange-bg)',
              color: 'var(--orange-dark)',
              borderColor: 'var(--border-light)',
            }}
            onClick={onCancel}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
