import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getPinState } from '@/lib/security/pin-engine';

// ── Types ───────────────────────────────────────────────────────────────────
interface IdentityContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error: string | null; user: User | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const IdentityContext = createContext<IdentityContextType | null>(null);

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error('useIdentity must be used within IdentityProvider');
  return ctx;
}

// ── Provider ────────────────────────────────────────────────────────────────
export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Initialize ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setIsLoading(false);

          // If session exists, check PIN and route
          if (initialSession?.user) {
            await handlePostAuth(initialSession.user);
          }
        }
      } catch (err) {
        console.error('[Identity] Init error:', err);
        if (mounted) setIsLoading(false);
      }
    }

    init();

    // ── Auth State Listener ─────────────────────────────────────────────────
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[Identity] Auth event:', event);

      if (mounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }

      if (event === 'SIGNED_IN' && newSession?.user) {
        await handlePostAuth(newSession.user);
      }

      if (event === 'SIGNED_OUT') {
        router.replace('/auth/login');
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [router]);

  // ── Post-Auth PIN Check ───────────────────────────────────────────────────
  async function handlePostAuth(user: User) {
    try {
      const state = await getPinState();
      console.log('[Identity] Post-auth PIN state:', state);

      if (!state.isSet) {
        // No PIN — send to setup
        router.replace('/auth/set-pin');
      } else if (state.isLocked) {
        // Locked — send to lock screen
        router.replace('/auth/lock-screen');
      } else {
        // PIN set and not locked — send to lock screen to unlock
        router.replace('/auth/lock-screen');
      }
    } catch (err) {
      console.warn('[Identity] PIN check failed:', err);
      // If PIN check fails, proceed without PIN
      router.replace('/(os)');
    }
  }

  // ── Sign In ───────────────────────────────────────────────────────────────
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { error: error.message };
      }

      // Session will be picked up by onAuthStateChange
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Sign in failed' };
    }
  };

  // ── Sign Up ───────────────────────────────────────────────────────────────
  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });

      if (error) {
        return { error: error.message, user: null };
      }

      return { error: null, user: data.user };
    } catch (err: any) {
      return { error: err.message || 'Sign up failed', user: null };
    }
  };

  // ── Sign Out ────────────────────────────────────────────────────────────────
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // State will be cleared by onAuthStateChange
    } catch (err) {
      console.error('[Identity] Sign out error:', err);
      // Force clear anyway
      setSession(null);
      setUser(null);
      router.replace('/auth/login');
    }
  };

  // ── Refresh Session ─────────────────────────────────────────────────────────
  const refreshSession = async () => {
    try {
      const { data: { session: refreshed } } = await supabase.auth.getSession();
      setSession(refreshed);
      setUser(refreshed?.user ?? null);
    } catch (err) {
      console.error('[Identity] Refresh error:', err);
    }
  };

  // ── Value ─────────────────────────────────────────────────────────────────
  const value: IdentityContextType = {
    session,
    user,
    isLoading,
    isAuthenticated: !!session && !!user,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };

  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  );
}
