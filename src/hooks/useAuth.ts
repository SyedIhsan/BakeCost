/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { signInWithGoogle, signOut as signOutAuth } from '../lib/auth';
import { useStore } from '../store';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  signIn: typeof signInWithGoogle;
  signOut: typeof signOutAuth;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const clearAll = useStore((state) => state.clearAll);

  useEffect(() => {
    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOutAuth();
    // Clear local store so next user doesn't see lingering data
    clearAll();
  };

  return {
    user,
    loading,
    signIn: signInWithGoogle,
    signOut: handleSignOut,
  };
}
