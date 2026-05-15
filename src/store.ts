/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { Ingredient, PackagingItem, Product } from './types';
import { supabase } from './lib/supabase';
import type { Database } from './types/database';
import {
  ingredientFromDb,
  ingredientToDb,
  packagingFromDb,
  packagingToDb,
  productFromDb,
  productToDb,
} from './lib/dbMappers';

interface BakeStore {
  ingredients: Ingredient[];
  packaging: PackagingItem[];
  products: Product[];
  loading: {
    ingredients: boolean;
    packaging: boolean;
    products: boolean;
  };
  error: string | null;

  // Fetch actions
  fetchIngredients: () => Promise<void>;
  fetchPackaging: () => Promise<void>;
  fetchProducts: () => Promise<void>;

  // Ingredients Actions
  addIngredient: (ingredient: Omit<Ingredient, 'id'>) => Promise<void>;
  updateIngredient: (id: string, ingredient: Partial<Ingredient>) => Promise<void>;
  removeIngredient: (id: string) => Promise<void>;

  // Packaging Actions
  addPackaging: (item: Omit<PackagingItem, 'id'>) => Promise<void>;
  updatePackaging: (id: string, item: Partial<PackagingItem>) => Promise<void>;
  removePackaging: (id: string) => Promise<void>;

  // Products Actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;

  // Bulk Actions (local-only, for clearing on sign-out)
  setAllIngredients: (ingredients: Ingredient[]) => void;
  setAllPackaging: (packaging: PackagingItem[]) => void;
  clearAll: () => void;
}

export const useStore = create<BakeStore>((set, get) => ({
  ingredients: [],
  packaging: [],
  products: [],
  loading: {
    ingredients: false,
    packaging: false,
    products: false,
  },
  error: null,

  // Fetch ingredients from Supabase
  fetchIngredients: async () => {
    set((state) => ({
      loading: { ...state.loading, ingredients: true },
      error: null,
    }));
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      set((state) => ({
        ingredients: (data || []).map(ingredientFromDb),
        loading: { ...state.loading, ingredients: false },
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch ingredients';
      set((state) => ({
        error: errorMsg,
        loading: { ...state.loading, ingredients: false },
      }));
      throw err;
    }
  },

  // Fetch packaging from Supabase
  fetchPackaging: async () => {
    set((state) => ({
      loading: { ...state.loading, packaging: true },
      error: null,
    }));
    try {
      const { data, error } = await supabase
        .from('packaging')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      set((state) => ({
        packaging: (data || []).map(packagingFromDb),
        loading: { ...state.loading, packaging: false },
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch packaging';
      set((state) => ({
        error: errorMsg,
        loading: { ...state.loading, packaging: false },
      }));
      throw err;
    }
  },

  // Fetch products from Supabase
  fetchProducts: async () => {
    set((state) => ({
      loading: { ...state.loading, products: true },
      error: null,
    }));
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      set((state) => ({
        products: (data || []).map(productFromDb),
        loading: { ...state.loading, products: false },
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch products';
      set((state) => ({
        error: errorMsg,
        loading: { ...state.loading, products: false },
      }));
      throw err;
    }
  },

  // Add ingredient
  addIngredient: async (ingredient) => {
    try {
      const { data: sessionData } = await supabase.auth.getUser();
      if (!sessionData.user?.id) throw new Error('Not authenticated');

      const dbIngredient = ingredientToDb(
        { ...ingredient, id: crypto.randomUUID() } as Ingredient,
        sessionData.user.id
      );

      const { data, error } = await supabase.from('ingredients').insert([dbIngredient as any] as any).select().single();

      if (error) throw error;

      set((state) => ({
        ingredients: [...state.ingredients, ingredientFromDb(data)],
        error: null,
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add ingredient';
      set({ error: errorMsg });
      throw err;
    }
  },

  // Update ingredient
  updateIngredient: async (id, updated) => {
    try {
      const dbUpdate = ingredientToDb(
        { ...get().ingredients.find((i) => i.id === id)!, ...updated } as Ingredient,
        (await supabase.auth.getUser()).data.user!.id
      );

      // @ts-expect-error - Supabase type inference limitation
      const { error } = await supabase.from('ingredients').update(dbUpdate as any).eq('id', id);

      if (error) throw error;

      set((state) => ({
        ingredients: state.ingredients.map((ing) =>
          ing.id === id ? { ...ing, ...updated } : ing
        ),
        error: null,
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update ingredient';
      set({ error: errorMsg });
      throw err;
    }
  },

  // Remove ingredient
  removeIngredient: async (id) => {
    try {
      const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        ingredients: state.ingredients.filter((ing) => ing.id !== id),
        error: null,
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete ingredient';
      set({ error: errorMsg });
      throw err;
    }
  },

  // Add packaging
  addPackaging: async (item) => {
    try {
      const { data: sessionData } = await supabase.auth.getUser();
      if (!sessionData.user?.id) throw new Error('Not authenticated');

      const dbPackaging = packagingToDb(
        { ...item, id: crypto.randomUUID() } as PackagingItem,
        sessionData.user.id
      );

      const { data, error } = await supabase.from('packaging').insert([dbPackaging as any] as any).select().single();

      if (error) throw error;

      set((state) => ({
        packaging: [...state.packaging, packagingFromDb(data)],
        error: null,
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add packaging';
      set({ error: errorMsg });
      throw err;
    }
  },

  // Update packaging
  updatePackaging: async (id, updated) => {
    try {
      const dbUpdate = packagingToDb(
        { ...get().packaging.find((p) => p.id === id)!, ...updated } as PackagingItem,
        (await supabase.auth.getUser()).data.user!.id
      );

      // @ts-expect-error - Supabase type inference limitation
      const { error } = await supabase.from('packaging').update(dbUpdate as any).eq('id', id);

      if (error) throw error;

      set((state) => ({
        packaging: state.packaging.map((pkg) =>
          pkg.id === id ? { ...pkg, ...updated } : pkg
        ),
        error: null,
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update packaging';
      set({ error: errorMsg });
      throw err;
    }
  },

  // Remove packaging
  removePackaging: async (id) => {
    try {
      const { error } = await supabase
        .from('packaging')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        packaging: state.packaging.filter((pkg) => pkg.id !== id),
        error: null,
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete packaging';
      set({ error: errorMsg });
      throw err;
    }
  },

  // Add product
  addProduct: async (product) => {
    try {
      const { data: sessionData } = await supabase.auth.getUser();
      if (!sessionData.user?.id) throw new Error('Not authenticated');

      const fullProduct: Product = {
        ...product,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const dbProduct = productToDb(fullProduct, sessionData.user.id);

      const { data, error } = await supabase.from('products').insert([dbProduct as any] as any).select().single();

      if (error) throw error;

      set((state) => ({
        products: [...state.products, productFromDb(data)],
        error: null,
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add product';
      set({ error: errorMsg });
      throw err;
    }
  },

  // Update product
  updateProduct: async (id, updated) => {
    try {
      const dbUpdate = productToDb(
        { ...get().products.find((p) => p.id === id)!, ...updated } as Product,
        (await supabase.auth.getUser()).data.user!.id
      );

      // @ts-expect-error - Supabase type inference limitation
      const { error } = await supabase.from('products').update(dbUpdate as any).eq('id', id);

      if (error) throw error;

      set((state) => ({
        products: state.products.map((p) =>
          p.id === id ? { ...p, ...updated } : p
        ),
        error: null,
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update product';
      set({ error: errorMsg });
      throw err;
    }
  },

  // Remove product
  removeProduct: async (id) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
        error: null,
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete product';
      set({ error: errorMsg });
      throw err;
    }
  },

  // Local-only bulk setters (for sign-out clearing)
  setAllIngredients: (ingredients) => set({ ingredients, error: null }),
  setAllPackaging: (packaging) => set({ packaging, error: null }),
  clearAll: () =>
    set({
      ingredients: [],
      packaging: [],
      products: [],
      error: null,
    }),
}));

