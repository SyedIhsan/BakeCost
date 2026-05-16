/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { useStore } from '../store';
import { Ingredient, Unit } from '../types';
import { formatRM } from '../lib/format';
import { Dialog } from './Dialog';
import { SearchInput } from './SearchInput';
import { ConfirmDialog } from './ConfirmDialog';
import { IngredientIcon } from './icons/IngredientIcon';

export function IngredientsTab() {
  const { ingredients, loading, error, addIngredient, updateIngredient, removeIngredient, fetchIngredients } = useStore();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Form state
  const [form, setForm] = useState<Partial<Ingredient>>({
    name: '',
    packPrice: 0,
    packSize: 0,
    unit: 'g',
    supplierLink: '',
  });

  const filteredIngredients = ingredients.filter(ing => 
    ing.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    setEditingId(null);
    setForm({ name: '', packPrice: 0, packSize: 0, unit: 'g', supplierLink: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (ing: Ingredient) => {
    setEditingId(ing.id);
    setForm(ing);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = {
        name: form.name || 'Unnamed Ingredient',
        packPrice: Number(form.packPrice) || 0,
        packSize: Number(form.packSize) || 0,
        unit: form.unit as Unit,
        supplierLink: form.supplierLink || undefined,
      };

      if (editingId) {
        await updateIngredient(editingId, data);
      } else {
        await addIngredient(data);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save ingredient:', error);
      alert('Failed to save ingredient. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await removeIngredient(deleteConfirmId);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete ingredient:', error);
      alert('Failed to delete ingredient. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => fetchIngredients()}
            className="text-xs font-semibold text-red-700 hover:text-red-900 px-2 py-1"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search ingredients..." />
        {loading.ingredients && ingredients.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium uppercase tracking-wider px-1">
            <div className="w-3 h-3 border-2 border-brand-matcha border-t-transparent rounded-full animate-spin" />
            Loading...
          </div>
        ) : (
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider px-1">
            {filteredIngredients.length} Ingredients
          </p>
        )}
      </div>

      <div className="grid gap-3 pb-20">
        {filteredIngredients.length > 0 ? (
          filteredIngredients.map((ing) => (
            <div key={ing.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{ing.name}</h3>
                <p className="text-sm text-gray-500">
                  {formatRM(ing.packPrice)} / {ing.packSize}{ing.unit}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {ing.supplierLink && (
                  <a 
                    href={ing.supplierLink} 
                    target="_blank" rel="noreferrer"
                    className="p-2 text-gray-400 hover:text-brand-matcha rounded-full hover:bg-brand-matcha/5 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button 
                  onClick={() => handleEdit(ing)}
                  className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(ing.id)}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <IngredientIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No ingredients found.</p>
          </div>
        )}
      </div>

      <button
        onClick={handleAdd}
        className="fixed bottom-6 right-6 w-14 h-14 bg-brand-matcha text-white rounded-full shadow-lg shadow-brand-matcha/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-20"
      >
        <Plus className="w-6 h-6" />
      </button>

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingId ? 'Edit Ingredient' : 'Add Ingredient'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Ingredient Name</label>
            <input
              required
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-matcha/20 focus:border-brand-matcha"
              placeholder="e.g. Salted Butter"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Pack Price (RM)</label>
              <input
                required
                type="number"
                step="0.01"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-matcha/20 focus:border-brand-matcha"
                placeholder="11.50"
                value={form.packPrice || ''}
                onChange={e => setForm({ ...form, packPrice: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Pack Size</label>
              <input
                required
                type="number"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-matcha/20 focus:border-brand-matcha"
                placeholder="250"
                value={form.packSize || ''}
                onChange={e => setForm({ ...form, packSize: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Unit</label>
            <div className="flex gap-2">
              {['g', 'ml', 'unit'].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setForm({ ...form, unit: u as Unit })}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                    form.unit === u 
                      ? 'bg-brand-matcha text-white border-brand-matcha' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Supplier Link (Optional)</label>
            <input
              type="url"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-matcha/20 focus:border-brand-matcha"
              placeholder="https://..."
              value={form.supplierLink}
              onChange={e => setForm({ ...form, supplierLink: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-brand-matcha text-white py-3 rounded-xl font-bold shadow-lg shadow-brand-matcha/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              editingId ? 'Save Changes' : 'Add Ingredient'
            )}
          </button>
        </form>
      </Dialog>

      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Ingredient?"
        message={`Delete ${ingredients.find(i => i.id === deleteConfirmId)?.name}? This can't be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
