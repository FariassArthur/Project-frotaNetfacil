import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchListPaginated, createItem, updateItem, deleteItem } from '../api/client';
import EntityForm from './EntityForm';
import EntityTable from './EntityTable';
import { useToast } from './Toast';

const PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 50;

export default function GenericModule({ moduleConfig, token, vehicles, cidades, filterParams, onItemSelect }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({});
  const [initialFormData, setInitialFormData] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const isPaginating = useRef(false);

  useEffect(() => {
    setPage(1);
  }, [moduleConfig.key, filterParams]);

  useEffect(() => {
    loadItems();
  }, [moduleConfig.key, filterParams, page, pageSize]);

  const loadItems = async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({ ...filterParams, _page: page, _limit: pageSize });
      const result = await fetchListPaginated(`${moduleConfig.endpoint}?${query}`, token);
      setItems(Array.isArray(result.data) ? result.data : []);
      setTotalCount(result.total || 0);
      if (!isPaginating.current) {
        setFormData({});
        setSelectedItem(null);
        setIsDirty(false);
      }
    } catch (err) {
      setError('Erro ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
      isPaginating.current = false;
    }
  };

  const handlePageChange = (newPage) => {
    isPaginating.current = true;
    setPage(newPage);
  };

  const handleFieldChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setFormData({ ...item });
    setInitialFormData({ ...item });
    setFormOpen(true);
    setIsDirty(false);
    if (onItemSelect) onItemSelect(item);
  };

  const closeForm = useCallback(() => {
    if (isDirty) {
      if (!window.confirm('Há alterações não salvas. Deseja realmente descartá-las?')) return;
    }
    setFormOpen(false);
    setSelectedItem(null);
    setFormData({});
    setInitialFormData({});
    setIsDirty(false);
  }, [isDirty]);

  useEffect(() => {
    if (!formOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') closeForm();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [formOpen, closeForm]);

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
      setFormOpen(false);
      setSelectedItem(null);
      setFormData({});
      setIsDirty(false);
    } catch (err) {
      setError('Erro ao salvar');
      toast.error('Erro ao salvar registro');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchDelete = async (indices) => {
    const toDelete = indices.map(i => items[i]).filter(Boolean);
    if (toDelete.length === 0) return;
    setLoading(true);
    try {
      for (const item of toDelete) {
        await deleteItem(moduleConfig.endpoint, item[moduleConfig.keyField], token);
      }
      toast.success(`${toDelete.length} registro(s) excluído(s) com sucesso`);
      await loadItems();
    } catch (err) {
      toast.error('Erro ao excluir registros');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const itemLabel = item[moduleConfig.fields.find(f => f.required)?.name] || item[moduleConfig.keyField] || item.id || 'registro';
    if (!window.confirm(`Deseja deletar "${itemLabel}"? Esta ação não pode ser desfeita.`)) return;
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

  const dateFields = moduleConfig.fields.filter(f => f.type === 'date' && !f.tableOnly);
  const [dateFilters, setDateFilters] = useState({});

  const inputBase = 'px-3 py-2 rounded-lg border text-sm outline-none transition-colors';

  const btnBase = 'px-4 py-2 rounded-[12px] font-semibold text-sm border-none cursor-pointer transition-colors';

  const handleNewItem = () => {
    setSelectedItem(null);
    setFormData({});
    setInitialFormData({});
    setFormOpen(true);
    setIsDirty(false);
  };

  return (
    <div className="p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{moduleConfig.label}</h2>
      </div>
      {dateFields.length > 0 && (
        <div className="flex gap-3 items-end flex-wrap mb-4 p-3 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
          {dateFields.slice(0, 2).map((f) => (
            <div key={f.name} className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{f.label}</label>
              <input type="date" className={inputBase}
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                value={dateFilters[`${f.name}_start`] || ''}
                onChange={(e) => setDateFilters(prev => ({ ...prev, [`${f.name}_start`]: e.target.value }))}
              />
            </div>
          ))}
          {dateFields.length > 0 && (
            <button className="px-3 py-2 rounded-lg text-xs font-semibold border-none cursor-pointer"
              style={{ background: 'var(--orange)', color: 'white' }}
              onClick={() => setDateFilters({})}
            >
              Limpar
            </button>
          )}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm mb-4 border" style={{
          background: 'var(--orange-bg)',
          color: 'var(--danger)',
          borderColor: 'var(--border-light)',
        }}>
          <span>{error}</span>
          <button className="ml-auto bg-transparent border-none cursor-pointer text-sm font-bold" style={{ color: 'var(--danger)' }} onClick={() => setError('')}>&times;</button>
        </div>
      )}

      <div className="grid gap-6" style={{ gridTemplateColumns: formOpen ? '1fr 1fr' : '1fr' }}>
        {formOpen && (
          <div>
            <button
              type="button"
              className="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg border mb-4 cursor-pointer text-sm font-semibold"
              style={{
                background: 'var(--orange-bg)',
                borderColor: 'var(--border-light)',
                color: 'var(--orange-dark)',
              }}
              onClick={closeForm}
              title="Fechar formulário"
            >
              <span>{selectedItem ? 'Editar' : 'Novo'}</span>
              <span className="ml-auto text-lg">&times;</span>
            </button>
            <EntityForm
              fields={moduleConfig.fields}
              formData={formData}
              onChange={handleFieldChange}
              onSubmit={handleSubmit}
              onCancel={closeForm}
              vehicles={vehicles || []}
              cidades={cidades || []}
              isNew={!selectedItem}
              isSubmitting={loading}
            />
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Registros</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <label htmlFor="page-size-select" className="text-xs">Exibir:</label>
                <select
                  id="page-size-select"
                  className="px-2 py-1 rounded-lg border text-xs outline-none cursor-pointer"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                >
                  {PAGE_SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {!formOpen && (
                <button
                  type="button"
                  className={`${btnBase} text-white`}
                  style={{ background: 'var(--orange)' }}
                  onClick={handleNewItem}
                >
                  + Novo
                </button>
              )}
            </div>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 py-8 justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="inline-block w-4 h-4 border-2 border-[var(--orange)] border-t-transparent rounded-full animate-[spin_0.6s_linear_infinite]" />
              Carregando...
            </div>
          ) : (
            <EntityTable
              items={items}
              fields={moduleConfig.fields}
              onSelect={handleSelectItem}
              onDelete={handleDelete}
              onBatchDelete={handleBatchDelete}
              totalCount={totalCount}
              page={page}
              pageSize={pageSize}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
