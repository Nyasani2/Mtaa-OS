// lib/auth/identity-provider.tsx
// v3.1: Thin compatibility wrapper — delegates to Zustand store

import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from './store/auth.store';
import type { User } from './store/auth.store';

export interface IdentityContextValue {
  user: User | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: Error }>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error?: Error; user?: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: Error }>;
  updateProfile: (data: Record<string, unknown>) => Promise<{ error?: Error }>;
  refreshSession: () => Promise<void>;
}

export const IdentityContext = createContext<IdentityContextValue | undefined>(undefined);

export function useIdentity(): IdentityContextValue {
  const store = useAuthStore();
  const context = useContext(IdentityContext);
  if (context === undefined) {
    return {
      user: store.user,
      session: store.session,
      isLoading: store.isLoading,
      isAuthenticated: store.isAuthenticated,
      signIn: async (email, password) => {
        const r = await store.signIn(email, password);
        return { error: r.error ? new Error(r.error) : undefined };
      },
      signUp: async (email, password, metadata) => {
        const r = await store.signUp(email, password, metadata);
        return { error: r.error ? new Error(r.error) : undefined, user: r.user };
      },
      signOut: store.signOut,
      resetPassword: async (email) => {
        const r = await store.resetPassword(email);
        return { error: r.error ? new Error(r.error) : undefined };
      },
      updateProfile: async (data) => {
        const r = await store.updateProfile(data as Partial<User>);
        return { error: r.error ? new Error(r.error) : undefined };
      },
      refreshSession: async () => { await store.initialize(); },
    };
  }
  return context;
}

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const store = useAuthStore();
  useEffect(() => { store.initialize(); }, []);

  const value: IdentityContextValue = {
    user: store.user,
    session: store.session,
    isLoading: store.isLoading,
    isAuthenticated: store.isAuthenticated,
    signIn: async (email, password) => {
      const r = await store.signIn(email, password);
      return { error: r.error ? new Error(r.error) : undefined };
    },
    signUp: async (email, password, metadata) => {
      const r = await store.signUp(email, password, metadata);
      return { error: r.error ? new Error(r.error) : undefined, user: r.user };
    },
    signOut: store.signOut,
    resetPassword: async (email) => {
      const r = await store.resetPassword(email);
      return { error: r.error ? new Error(r.error) : undefined };
    },
    updateProfile: async (data) => {
      const r = await store.updateProfile(data as Partial<User>);
      return { error: r.error ? new Error(r.error) : undefined };
    },
    refreshSession: async () => { await store.initialize(); },
  };

  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  );
}