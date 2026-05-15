/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { SAMPLE_INGREDIENTS, SAMPLE_PACKAGING, SAMPLE_PRODUCTS } from '../lib/sampleData';
import { Ingredient, PackagingItem, Product } from '../types';
import { ConfirmDialog } from './ConfirmDialog';

export function MigrationBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const { addIngredient, addPackaging, addProduct } = useStore();

  useEffect(() => {
    // Check for old localStorage data on mount
    const localDataStr = localStorage.getItem('bakecost-storage');
    if (localDataStr) {
      try {
        const localData = JSON.parse(localDataStr);
        if (localData.state) {
          const { ingredients, packaging, products } = localData.state;
          if (
            (ingredients && ingredients.length > 0) ||
            (packaging && packaging.length > 0) ||
            (products && products.length > 0)
          ) {
            setShowBanner(true);
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  const handleImport = async () => {
    setMigrating(true);
    setProgress('Importing...');
    try {
      const localDataStr = localStorage.getItem('bakecost-storage');
      if (!localDataStr) return;

      const localData = JSON.parse(localDataStr);
      if (!localData.state) return;

      const { ingredients = [], packaging = [], products = [] } = localData.state;
      const total = ingredients.length + packaging.length + products.length;
      let imported = 0;

      // Import ingredients
      for (const ing of ingredients) {
        try {
          await addIngredient({
            name: ing.name,
            packPrice: ing.packPrice,
            packSize: ing.packSize,
            unit: ing.unit,
            supplierLink: ing.supplierLink,
          });
          imported++;
          setProgress(`Importing ${imported} of ${total}...`);
        } catch (err) {
          console.error('Failed to import ingredient:', err);
        }
      }

      // Import packaging
      for (const pkg of packaging) {
        try {
          await addPackaging({
            name: pkg.name,
            packPrice: pkg.packPrice,
            packQuantity: pkg.packQuantity,
            supplierLink: pkg.supplierLink,
          });
          imported++;
          setProgress(`Importing ${imported} of ${total}...`);
        } catch (err) {
          console.error('Failed to import packaging:', err);
        }
      }

      // Import products
      for (const prod of products) {
        try {
          await addProduct({
            name: prod.name,
            quantityProducedPerBatch: prod.quantityProducedPerBatch,
            recipe: prod.recipe,
            packaging: prod.packaging,
            overhead: prod.overhead,
            labor: prod.labor,
            marketingPercentage: prod.marketingPercentage,
            margins: prod.margins,
            sstEnabled: prod.sstEnabled,
            decidedSalePrice: prod.decidedSalePrice,
          });
          imported++;
          setProgress(`Importing ${imported} of ${total}...`);
        } catch (err) {
          console.error('Failed to import product:', err);
        }
      }

      // Clear localStorage
      localStorage.removeItem('bakecost-storage');
      setShowBanner(false);
      alert(`Imported ${imported} items (${ingredients.length} ingredients, ${packaging.length} packaging, ${products.length} products).`);
    } catch (err) {
      console.error('Migration failed:', err);
      alert('Migration failed. Please try again.');
    } finally {
      setMigrating(false);
      setProgress(null);
    }
  };

  const handleDiscard = () => {
    setShowDiscardConfirm(true);
  };

  const handleConfirmDiscard = async () => {
    localStorage.removeItem('bakecost-storage');
    setShowBanner(false);
    setShowDiscardConfirm(false);
  };

  if (!showBanner) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mx-4 my-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">
            We found existing data in this browser.
          </p>
          <p className="text-xs text-blue-700 mt-1">
            {progress || 'Import it to your account?'}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleDiscard}
            disabled={migrating}
            className="px-3 py-1 text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded hover:bg-blue-50 disabled:opacity-50 transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handleImport}
            disabled={migrating}
            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1"
          >
            {migrating ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Importing...
              </>
            ) : (
              'Import'
            )}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={handleConfirmDiscard}
        title="Discard Local Data?"
        message="This will delete the local data without copying it to your account. This can't be undone."
        confirmLabel="Discard"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
