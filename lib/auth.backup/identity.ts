/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  LAYER 1: IDENTITY ENGINE — Supabase Auth (Single Source)    ║
 * ║  MTAA_OS_V10 — DO NOT DUPLICATE THIS ANYWHERE ELSE           ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * RULES:
 * 1. This is the ONLY file that talks to supabase.auth
 * 2. No UI logic here — pure identity operations
 * 3. Session state lives ONLY in Supabase, NOT in Zustand
 * 4. One listener to rule them all (registered in app/_layout.tsx)
 */

import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";

// ─── Types ─────────────────────────────────────────────────

export type IdentityState = {
  session: Session | null;
  user: User | null;
  isLoading: boolean; // true while booting, false once resolved
};

// ─── Singleton State (module-level, not Zustand) ───────────
// We use a simple module-level state that components read via hooks.
// This avoids Zustand for auth state while still being reactive.

let _state: IdentityState = {
  session: null,
  user: null,
  isLoading: true,
};

const _listeners = new Set<(state: IdentityState) => void>();

function _notify() {
  _listeners.forEach((fn) => fn({ ..._state }));
}

function _setState(partial: Partial<IdentityState>) {
  _state = { ..._state, ...partial };
  _notify();
}

// ─── Public API ────────────────────────────────────────────

export const identityEngine = {
  /**
   * Get current state (non-reactive, for imperative checks)
   */
  getState(): IdentityState {
    return { ..._state };
  },

  /**
   * Subscribe to identity changes.
   * Returns unsubscribe function.
   */
  subscribe(fn: (state: IdentityState) => void): () => void {
    _listeners.add(fn);
    // Immediately emit current state so subscriber is in sync
    fn({ ..._state });
    return () => {
      _listeners.delete(fn);
    };
  },

  /**
   * BOOT SEQUENCE — Call once at app startup.
   * Checks for existing session and hydrates state.
   */
  async boot(): Promise<void> {
    _setState({ isLoading: true });

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("[IdentityEngine] Session fetch error:", error.message);
        _setState({ session: null, user: null, isLoading: false });
        return;
      }

      const session = data.session;

      if (session?.user) {
        _setState({
          session,
          user: session.user,
          isLoading: false,
        });
      } else {
        _setState({ session: null, user: null, isLoading: false });
      }
    } catch (err) {
      console.error("[IdentityEngine] Boot crash:", err);
      _setState({ session: null, user: null, isLoading: false });
    }
  },

  /**
   * Start the SINGLE auth state listener.
   * Call this once after boot. Returns cleanup function.
   */
  startListener(): () => void {
    const { data } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          _setState({
            session,
            user: session.user,
            isLoading: false,
          });
        } else {
          _setState({
            session: null,
            user: null,
            isLoading: false,
          });
        }
      }
    );

    return () => {
      data.subscription.unsubscribe();
    };
  },

  /**
   * Sign in with email/password
   */
  async signIn(email: string, password: string): Promise<Session> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (!data.session) throw new Error("No session returned after sign in");
    _setState({ session: data.session, user: data.user, isLoading: false });
    return data.session;
  },

  /**
   * Sign up with email/password
   */
  async signUp(
    email: string,
    password: string,
    metadata?: Record<string, any>
  ): Promise<{ user: User | null; session: Session | null }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) throw error;
    return { user: data.user, session: data.session };
  },

  /**
   * Sign out — clears everything
   */
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    _setState({ session: null, user: null, isLoading: false });
  },

  /**
   * Refresh profile from profiles table
   */
  async refreshProfile(userId: string): Promise<Record<string, any> | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.warn("[IdentityEngine] Profile fetch:", error.message);
      return null;
    }
    return data;
  },
};

// ─── React Hook ────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";

export function useIdentity(): IdentityState & {
  signIn: typeof identityEngine.signIn;
  signUp: typeof identityEngine.signUp;
  signOut: typeof identityEngine.signOut;
  refreshProfile: typeof identityEngine.refreshProfile;
} {
  const [state, setState] = useState<IdentityState>(_state);

  useEffect(() => {
    return identityEngine.subscribe(setState);
  }, []);

  return {
    ...state,
    signIn: identityEngine.signIn,
    signUp: identityEngine.signUp,
    signOut: identityEngine.signOut,
    refreshProfile: identityEngine.refreshProfile,
  };
}
