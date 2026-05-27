import React, { useState, useEffect } from 'react';
import { fetchList, createItem, updateItem, deleteItem } from '../api/client';
import EntityForm from './EntityForm';
import EntityTable from './EntityTable';

export default function GenericModule({ moduleConfig, token, vehicles }) {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadItems();
  }, [moduleConfig.key]);

  const loadItems = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchList(moduleConfig.endpoint, token);
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
      {error && <div className="module-error">{error}</div>}

      <div className="module-content">
        <div className="module-form-section">
          <h3>{selectedItem ? 'Editar' : 'Novo'}</h3>
          <EntityForm
            fields={moduleConfig.fields}
            formData={formData}
            onChange={handleFieldChange}
            onSubmit={handleSubmit}
            vehicles={vehicles || []}
            isNew={!selectedItem}
            isSubmitting={loading}
          />
        </div>

        <div className="module-table-section">
          <h3>Registros</h3>
          {loading ? (
            <p style={{ color: '#888' }}>Carregando...</p>
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
