/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDataSync } from '../hooks/useDataSync';
import { useStore } from '../store';
import { LoginScreen } from './LoginScreen';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, loading: authLoading } = useAuth();
  const { loading: storeLoading, ingredients, packaging, products } = useStore();
  useDataSync(user);

  const isInitiallyFetching =
    (storeLoading.ingredients ||
      storeLoading.packaging ||
      storeLoading.products) &&
    ingredients.length === 0 &&
    packaging.length === 0 &&
    products.length === 0;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-matcha border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (isInitiallyFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-matcha border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Syncing your data...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
