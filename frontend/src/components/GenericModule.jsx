import React, { useState, useEffect } from 'react';
import { fetchListPaginated, createItem, updateItem, deleteItem } from '../api/client';
import EntityForm from './EntityForm';
import EntityTable from './EntityTable';
import { useToast } from './Toast';

const PAGE_SIZE = 50;

export default function GenericModule({ moduleConfig, token, vehicles, cidades, filterParams, onItemSelect }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [moduleConfig.key, filterParams]);

  useEffect(() => {
    loadItems();
  }, [moduleConfig.key, filterParams, page]);

  const loadItems = async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({ ...filterParams, _page: page, _limit: PAGE_SIZE });
      const result = await fetchListPaginated(`${moduleConfig.endpoint}?${query}`, token);
      setItems(Array.isArray(result.data) ? result.data : []);
      setTotalCount(result.total || 0);
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
        toast.success('Registro atualizado com sucesso');
        await loadItems();
      } else {
        await createItem(moduleConfig.endpoint, formData, token);
        toast.success('Registro criado com sucesso');
        await loadItems();
      }
    } catch (err) {
      setError('Erro ao salvar');
      toast.error('Erro ao salvar registro');
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
      toast.success('Registro excluído com sucesso');
      await loadItems();
    } catch (err) {
      setError('Erro ao deletar');
      toast.error('Erro ao excluir registro');
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
              totalCount={totalCount}
              page={page}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
