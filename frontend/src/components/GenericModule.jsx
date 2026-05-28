import React, { useState, useEffect } from 'react';
import { fetchList, createItem, updateItem, deleteItem } from '../api/client';
import EntityForm from './EntityForm';
import EntityTable from './EntityTable';

export default function GenericModule({ moduleConfig, token, vehicles, cidades, filterParams, onItemSelect }) {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    loadItems();
  }, [moduleConfig.key, filterParams]);

  const loadItems = async () => {
    setLoading(true);
    setError('');
    try {
      const params = filterParams ? '?' + new URLSearchParams(filterParams).toString() : '';
      const data = await fetchList(moduleConfig.endpoint + params, token);
      setItems(Array.isArray(data) ? data : []);
      setFormData({});
      setSelectedItem(null);
    } catch (err) {
      setError('Erro ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setFormData(item);
    setFormOpen(true);
    if (onItemSelect) onItemSelect(item);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (selectedItem && moduleConfig.keyField) {
        const id = selectedItem[moduleConfig.keyField];
        await updateItem(moduleConfig.endpoint, id, formData, token);
        await loadItems();
      } else {
        await createItem(moduleConfig.endpoint, formData, token);
        await loadItems();
      }
    } catch (err) {
      setError('Erro ao salvar');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Deseja deletar este registro?`)) return;
    setLoading(true);
    try {
      await deleteItem(moduleConfig.endpoint, item[moduleConfig.keyField], token);
      await loadItems();
    } catch (err) {
      setError('Erro ao deletar');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="module-container">
      <h2>{moduleConfig.label}</h2>
      {error && <div className="module-error">{error} <button className="error-dismiss" onClick={() => setError('')}>✕</button></div>}

      <div className="module-content" style={{ gridTemplateColumns: formOpen ? '1fr 1fr' : '1fr' }}>
        <div className="module-form-section" style={{ display: formOpen ? undefined : 'none' }}>
          <button
            type="button"
            className="form-collapse-btn"
            onClick={() => setFormOpen(false)}
            title="Recolher formulário"
          >
            <span className="form-collapse-label">{selectedItem ? 'Editar' : 'Novo'}</span>
            <span className="form-collapse-arrow open">▾</span>
          </button>
          <EntityForm
            fields={moduleConfig.fields}
            formData={formData}
            onChange={handleFieldChange}
            onSubmit={handleSubmit}
            vehicles={vehicles || []}
            cidades={cidades || []}
            isNew={!selectedItem}
            isSubmitting={loading}
          />
        </div>

        <div className="module-table-section">
          <div className="module-table-header">
            <h3>Registros</h3>
            {!formOpen && (
              <button type="button" className="form-expand-btn" onClick={() => {
                setSelectedItem(null);
                setFormData({});
                setFormOpen(true);
              }}>
                + Novo
              </button>
            )}
          </div>
          {loading ? (
            <div className="loading-spinner">Carregando...</div>
          ) : (
            <EntityTable
              items={items}
              fields={moduleConfig.fields}
              onSelect={handleSelectItem}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
