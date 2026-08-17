import React, { createContext, useContext, useMemo } from 'react';
import { createApp, type ClientApplication } from '@shopify/app-bridge';

interface AppBridgeContextValue {
  app: ClientApplication | null;
}

const AppBridgeContext = createContext<AppBridgeContextValue>({ app: null });

export function useAppBridge() {
  return useContext(AppBridgeContext);
}

export function AppBridgeProvider({ children }: { children: React.ReactNode }) {
  const host = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('host')
    : null;

  const app = useMemo(() => {
    if (!host) return null;

    const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY || 'd8e86b3cf5b1deb9ed0cf04d5fc7473c';
    return createApp({
      apiKey,
      host,
      forceRedirect: false,
    });
  }, [host]);

  return (
    <AppBridgeContext.Provider value={{ app }}>
      {children}
    </AppBridgeContext.Provider>
  );
}
