'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

interface SubscriptionStatus {
  isPremium: boolean;
  generationsUsed: number;
  generationsLimit: number | null; // null = unlimited (premium)
  generationsRemaining: number | null; // null = unlimited (premium)
  collectionsUsed: number;
  collectionsLimit: number | null; // null = unlimited (premium)
}

interface SubscriptionContextType {
  status: SubscriptionStatus | null;
  loading: boolean;
  refresh: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  status: null,
  loading: false,
  refresh: () => null,
});

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback(() => setRefreshToken((token) => token + 1), []);

  useEffect(() => {
    if (!user) {
      setStatus(null);
      return;
    }

    setLoading(true);
    fetch('/api/premium')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setStatus(data))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, [user, refreshToken]);

  return (
    <SubscriptionContext.Provider value={{ status, loading, refresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
}
