/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { useStore } from '../store';
import { PackagingItem } from '../types';
import { formatRM } from '../lib/format';
import { Dialog } from './Dialog';
import { SearchInput } from './SearchInput';
import { ConfirmDialog } from './ConfirmDialog';
import { PackagingIcon } from './icons/PackagingIcon';

export function PackagingTab() {
  const { packaging, loading, error, addPackaging, updatePackaging, removePackaging, fetchPackaging } = useStore();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Form state
  const [form, setForm] = useState<Partial<PackagingItem>>({
    name: '',
    packPrice: 0,
    packQuantity: 0,
    supplierLink: '',
  });

  const filteredPackaging = packaging.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    setEditingId(null);
    setForm({ name: '', packPrice: 0, packQuantity: 0, supplierLink: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: PackagingItem) => {
    setEditingId(item.id);
    setForm(item);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = {
        name: form.name || 'Unnamed Packaging',
        packPrice: Number(form.packPrice) || 0,
        packQuantity: Number(form.packQuantity) || 0,
        supplierLink: form.supplierLink || undefined,
      };

      if (editingId) {
        await updatePackaging(editingId, data);
      } else {
        await addPackaging(data);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save packaging:', error);
      alert('Failed to save packaging. Please try again.');
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
      await removePackaging(deleteConfirmId);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete packaging:', error);
      alert('Failed to delete packaging. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => fetchPackaging()}
            className="text-xs font-semibold text-red-700 hover:text-red-900 px-2 py-1"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search packaging..." />
        {loading.packaging && packaging.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium uppercase tracking-wider px-1">
            <div className="w-3 h-3 border-2 border-brand-matcha border-t-transparent rounded-full animate-spin" />
            Loading...
          </div>
        ) : (
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider px-1">
            {filteredPackaging.length} Items
          </p>
        )}
      </div>

      <div className="grid gap-3 pb-20">
        {filteredPackaging.length > 0 ? (
          filteredPackaging.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                <p className="text-sm text-gray-500">
                  {formatRM(item.packPrice)} / {item.packQuantity} units
                </p>
              </div>
              <div className="flex items-center gap-1">
                {item.supplierLink && (
                  <a 
                    href={item.supplierLink} 
                    target="_blank" rel="noreferrer"
                    className="p-2 text-gray-400 hover:text-brand-matcha rounded-full hover:bg-brand-matcha/5 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button 
                  onClick={() => handleEdit(item)}
                  className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <PackagingIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No packaging found.</p>
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
        title={editingId ? 'Edit Packaging' : 'Add Packaging'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Packaging Name</label>
            <input
              required
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-matcha/20 focus:border-brand-matcha"
              placeholder="e.g. Cookie Bag"
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
                placeholder="15.00"
                value={form.packPrice || ''}
                onChange={e => setForm({ ...form, packPrice: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Pack Quantity</label>
              <input
                required
                type="number"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-matcha/20 focus:border-brand-matcha"
                placeholder="50"
                value={form.packQuantity || ''}
                onChange={e => setForm({ ...form, packQuantity: parseFloat(e.target.value) })}
              />
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
              editingId ? 'Save Changes' : 'Add Packaging'
            )}
          </button>
        </form>
      </Dialog>

      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Packaging?"
        message={`Delete ${packaging.find(p => p.id === deleteConfirmId)?.name}? This can't be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
