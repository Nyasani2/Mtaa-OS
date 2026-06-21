import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

export interface IdentityContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: Error }>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error?: Error; user?: User | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: Error }>;
  updateProfile: (data: Record<string, unknown>) => Promise<{ error?: Error }>;
  refreshSession: () => Promise<void>;
}

export const IdentityContext = createContext<IdentityContextValue | undefined>(undefined);

export function useIdentity(): IdentityContextValue {
  const context = useContext(IdentityContext);
  if (context === undefined) {
    throw new Error('useIdentity must be used within an IdentityProvider');
  }
  return context;
}

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null } }>((_, reject) =>
          setTimeout(() => reject(new Error('getSession timed out')), 5000)
        );

        let result: { data: { session: Session | null } };
        try {
          result = await Promise.race([sessionPromise, timeoutPromise]);
        } catch (timeoutErr) {
          console.warn('[Identity] getSession timed out, treating as no session');
          result = { data: { session: null } };
        }

        if (mounted) {
          setSession(result.data.session);
          setUser(result.data.session?.user ?? null);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[Identity] Init error:', err);
        if (mounted) setIsLoading(false);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      console.log('[Identity] Auth event:', _event);
      if (mounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ?? undefined };
  }, []);

  const signUp = useCallback(async (email: string, password: string, metadata?: Record<string, unknown>) => {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: metadata },
    });
    return { error: error ?? undefined, user: data.user };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error ?? undefined };
  }, []);

  const updateProfile = useCallback(async (data: Record<string, unknown>) => {
    const { error } = await supabase.auth.updateUser({ data });
    return { error: error ?? undefined };
  }, []);

  const refreshSession = useCallback(async () => {
    const { data: { session: refreshed } } = await supabase.auth.getSession();
    setSession(refreshed);
    setUser(refreshed?.user ?? null);
  }, []);

  const value: IdentityContextValue = {
    user, session, isLoading, isAuthenticated: !!user,
    signIn, signUp, signOut, resetPassword, updateProfile, refreshSession,
  };

  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  );
}
