/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { useStore } from '../store';

/**
 * Syncs data from Supabase when user logs in.
 * Called from AuthGate after auth completes.
 */
export function useDataSync(user: User | null) {
  const { fetchIngredients, fetchPackaging, fetchProducts } = useStore();

  useEffect(() => {
    if (!user) {
      return;
    }

    // Fetch all three data types in parallel when user logs in
    Promise.all([
      fetchIngredients(),
      fetchPackaging(),
      fetchProducts(),
    ]).catch((err) => {
      console.error('Failed to sync data on login:', err);
    });
  }, [user?.id, fetchIngredients, fetchPackaging, fetchProducts]);
}
