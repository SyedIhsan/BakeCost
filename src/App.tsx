/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { ChefHat, Database, Clock, ArrowRight, Copy, Trash2, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { IngredientsTab } from './components/IngredientsTab';
import { PackagingTab } from './components/PackagingTab';
import { ProductEditor } from './components/ProductEditor';
import { Onboarding } from './components/Onboarding';
import { AuthGate } from './components/AuthGate';
import { ConfirmDialog } from './components/ConfirmDialog';
import { MigrationBanner } from './components/MigrationBanner';
import { IngredientIcon } from './components/icons/IngredientIcon';
import { PackagingIcon } from './components/icons/PackagingIcon';
import { useAuth } from './hooks/useAuth';
import { useStore } from './store';
import { SAMPLE_INGREDIENTS, SAMPLE_PACKAGING, SAMPLE_PRODUCTS } from './lib/sampleData';
import { Product } from './types';
import { costPerUnit, sellingPrice } from './lib/calculations';
import { formatRM } from './lib/format';

type Tab = 'products' | 'ingredients' | 'packaging';

function UserMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!user) return null;

  const avatarUrl = user.user_metadata?.avatar_url;
  const fullName = user.user_metadata?.full_name || user.email || 'User';
  const email = user.email || '';
  const firstLetter = fullName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 hover:border-brand-matcha transition-colors flex items-center justify-center bg-brand-matcha/10 flex-shrink-0"
      >
        {avatarUrl && !avatarBroken ? (
          <img
            src={avatarUrl}
            alt={fullName}
            onError={() => setAvatarBroken(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs font-bold text-brand-matcha">{firstLetter}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">{fullName}</p>
            <p className="text-xs text-gray-500">{email}</p>
          </div>
          <button
            onClick={() => {
              signOut();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null | 'new'>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [deleteConfirmProductId, setDeleteConfirmProductId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLoadSampleConfirm, setShowLoadSampleConfirm] = useState(false);
  const { setAllIngredients, setAllPackaging, products, addProduct, removeProduct } = useStore();

  useEffect(() => {
    const hasOnboarded = localStorage.getItem('bakecost-onboarded');
    if (!hasOnboarded) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('bakecost-onboarded', 'true');
    setShowOnboarding(false);
  };

  const handleLoadSampleData = async () => {
    try {
      setIsDeleting(true);
      let imported = 0;

      // Import supabase once outside the loops
      const { supabase } = await import('./lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('Not authenticated');

      // Phase A: Import ingredients and collect real IDs
      const ingredientMap = new Map<string, string>();
      for (const ing of SAMPLE_INGREDIENTS) {
        try {
          const { data, error } = await supabase
            .from('ingredients')
            .insert({
              user_id: user.id,
              name: ing.name,
              pack_price: ing.packPrice,
              pack_size: ing.packSize,
              unit: ing.unit,
              supplier_link: ing.supplierLink || null,
            })
            .select()
            .single();

          if (error) throw error;
          if (data) {
            ingredientMap.set(ing.name, data.id);
            imported++;
          }
        } catch (err) {
          console.error('Failed to import ingredient:', err);
        }
      }

      // Phase B: Import packaging and collect real IDs
      const packagingMap = new Map<string, string>();
      for (const pkg of SAMPLE_PACKAGING) {
        try {
          const { data, error } = await supabase
            .from('packaging')
            .insert({
              user_id: user.id,
              name: pkg.name,
              pack_price: pkg.packPrice,
              pack_quantity: pkg.packQuantity,
              supplier_link: pkg.supplierLink || null,
            })
            .select()
            .single();

          if (error) throw error;
          if (data) {
            packagingMap.set(pkg.name, data.id);
            imported++;
          }
        } catch (err) {
          console.error('Failed to import packaging:', err);
        }
      }

      // Phase C & D: Import products with mapped IDs
      for (const prod of SAMPLE_PRODUCTS) {
        try {
          // Convert recipe ingredient names to real IDs
          const resolvedRecipe = prod.recipe.map(item => ({
            ingredientId: ingredientMap.get(item.ingredientId as string) || item.ingredientId,
            amountUsed: item.amountUsed,
          }));

          // Convert packaging names to real IDs
          const resolvedPackaging = prod.packaging.map(item => ({
            packagingId: packagingMap.get(item.packagingId as string) || item.packagingId,
            quantityUsed: item.quantityUsed,
          }));

          await useStore.getState().addProduct({
            name: prod.name,
            quantityProducedPerBatch: prod.quantityProducedPerBatch,
            recipe: resolvedRecipe,
            packaging: resolvedPackaging,
            overhead: prod.overhead,
            labor: prod.labor,
            marketingPercentage: prod.marketingPercentage,
            margins: prod.margins,
            sstEnabled: prod.sstEnabled,
            decidedSalePrice: prod.decidedSalePrice,
          });
          imported++;
        } catch (err) {
          console.error('Failed to import product:', err);
        }
      }

      // Phase E: Refresh store to display seeded data
      const { fetchIngredients, fetchPackaging, fetchProducts } = useStore.getState();
      await fetchIngredients();
      await fetchPackaging();
      await fetchProducts();

      alert(`Sample data loaded! Imported ${imported} items.`);
      setShowLoadSampleConfirm(false);
    } catch (error) {
      console.error('Failed to load sample data:', error);
      alert('Failed to load sample data. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setIsDeleting(true);
    try {
      await removeProduct(productId);
      setDeleteConfirmProductId(null);
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicateProduct = async (product: Product) => {
    try {
      const clone: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
        name: `${product.name} (Copy)`,
        quantityProducedPerBatch: product.quantityProducedPerBatch,
        recipe: product.recipe,
        packaging: product.packaging,
        overhead: product.overhead,
        labor: product.labor,
        marketingPercentage: product.marketingPercentage,
        margins: product.margins,
        sstEnabled: product.sstEnabled,
        decidedSalePrice: product.decidedSalePrice,
      };
      await addProduct(clone);
    } catch (error) {
      console.error('Failed to duplicate product:', error);
      alert('Failed to duplicate product. Please try again.');
    }
  };

  const tabs = [
    { id: 'products' as Tab, label: 'Products', icon: ChefHat },
    { id: 'ingredients' as Tab, label: 'Ingredients', icon: IngredientIcon },
    { id: 'packaging' as Tab, label: 'Packaging', icon: PackagingIcon },
  ];

  return (
    <AuthGate>
      <div className="min-h-screen flex flex-col max-w-md mx-auto bg-brand-cream shadow-xl relative overflow-x-hidden">
        <AnimatePresence>
          {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
        </AnimatePresence>

        <AnimatePresence>
          {editingProduct && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-40"
            >
              <ProductEditor 
                product={editingProduct === 'new' ? undefined : editingProduct} 
                onClose={() => setEditingProduct(null)} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete product confirmation */}
        <ConfirmDialog
          isOpen={deleteConfirmProductId !== null}
          onClose={() => setDeleteConfirmProductId(null)}
          onConfirm={() => deleteConfirmProductId ? handleDeleteProduct(deleteConfirmProductId) : Promise.resolve()}
          title="Delete Product?"
          message={`Delete ${products.find((p) => p.id === deleteConfirmProductId)?.name}? This can't be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
        />

        {/* Load sample data confirmation */}
        <ConfirmDialog
          isOpen={showLoadSampleConfirm}
          onClose={() => setShowLoadSampleConfirm(false)}
          onConfirm={handleLoadSampleData}
          title="Load Sample Data?"
          message="This will add the Matcha Cookies sample data to your account."
          confirmLabel="Load"
          cancelLabel="Cancel"
          variant="default"
        />

        {/* Top Navigation */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-brand-matcha flex items-center gap-2">
            <ChefHat className="w-6 h-6" />
            BakeCost
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  isActive 
                    ? "bg-brand-matcha text-white shadow-sm" 
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden xs:inline">{tab.label}</span>
              </button>
            );
          })}
            </div>
            <UserMenu />
          </div>
        </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <MigrationBanner />
        <AnimatePresence mode="wait">
          {activeTab === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {products.length > 0 ? (
                <div className="grid gap-4">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                      {products.length} Products
                    </p>
                    <button 
                      onClick={() => setEditingProduct('new')}
                      className="text-brand-matcha text-sm font-bold"
                    >
                      + New Product
                    </button>
                  </div>
                  {products.map((p) => {
                    const ingredients = useStore.getState().ingredients;
                    const packaging = useStore.getState().packaging;
                    const cpu = costPerUnit(p, ingredients, packaging);
                    const retailPrice = p.decidedSalePrice || (sellingPrice(cpu, p.margins.retailer, p.sstEnabled));
                    
                    return (
                      <div key={p.id} className="relative group">
                        <button 
                          onClick={() => setEditingProduct(p)}
                          className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-left hover:border-brand-matcha transition-all flex flex-col gap-3"
                        >
                          <div className="flex items-start justify-between w-full">
                            <div>
                              <h3 className="font-bold text-gray-900 group-hover:text-brand-matcha mb-1">{p.name}</h3>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                {new Date(p.updatedAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-gray-400 uppercase">Retail Price</p>
                              <p className="text-sm font-black text-brand-matcha">{formatRM(retailPrice)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                            <div className="bg-brand-matcha/10 px-2 py-0.5 rounded text-[10px] font-bold text-brand-matcha uppercase">
                              Cost: {formatRM(cpu)}
                            </div>
                            <span className="text-xs text-gray-400">
                              {p.quantityProducedPerBatch} units / batch
                            </span>
                          </div>
                        </button>
                        
                        <div className="absolute bottom-3 right-3 flex gap-1 z-10">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateProduct(p);
                            }}
                            className="bg-white p-1.5 rounded-lg border border-gray-100 shadow-sm text-gray-400 hover:text-brand-matcha transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmProductId(p.id);
                            }}
                            className="bg-white p-1.5 rounded-lg border border-gray-100 shadow-sm text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h2 className="text-lg font-semibold text-gray-900">No products yet</h2>
                  <p className="text-gray-500 text-sm mb-6">Start by calculating your first product price.</p>
                  <div className="flex flex-col gap-3 items-center">
                    <button 
                      onClick={() => setEditingProduct('new')}
                      className="bg-brand-matcha text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-brand-matcha/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      + Create Product
                    </button>
                    <button 
                      onClick={() => setShowLoadSampleConfirm(true)}
                      className="flex items-center gap-2 text-xs text-gray-400 hover:text-brand-matcha transition-colors"
                    >
                      <Database className="w-3 h-3" />
                      Load Matcha Cookies sample data
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'ingredients' && (
            <motion.div
              key="ingredients"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <IngredientsTab />
            </motion.div>
          )}

          {activeTab === 'packaging' && (
            <motion.div
              key="packaging"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <PackagingTab />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
    </AuthGate>
  );
}
