// MTAA Identity Engine — Main Hook
// One hook. One identity. Every module reads from here.

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchIdentityEngine, DEFAULT_STATE } from '../engine';
import { IdentityEngineState } from '../types';

let globalState: IdentityEngineState = DEFAULT_STATE;
const listeners: Set<(state: IdentityEngineState) => void> = new Set();
let isFetching = false;

function notifyListeners() {
  listeners.forEach((cb) => cb(globalState));
}

async function refreshGlobalState(userId: string) {
  if (isFetching) return;
  isFetching = true;
  globalState = { ...globalState, isLoading: true };
  notifyListeners();

  const newState = await fetchIdentityEngine(userId);
  globalState = newState;
  isFetching = false;
  notifyListeners();
}

export function useAuthStore() {
  const [state, setState] = useState<IdentityEngineState>(globalState);

  useEffect(() => {
    listeners.add(setState);
    setState(globalState);

    // Auto-refresh on mount if we have a user
    supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user?.id;
      if (userId && globalState.identity.user_id !== userId) {
        refreshGlobalState(userId);
      }
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.id) {
        refreshGlobalState(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        globalState = DEFAULT_STATE;
        notifyListeners();
      }
    });

    return () => {
      listeners.delete(setState);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    if (userId) {
      await refreshGlobalState(userId);
    }
  }, []);

  return {
    ...state,
    refresh,
    // Convenience aliases for common patterns
    user: state.identity,
    isAuthenticated: !!state.identity.user_id,
    isVerified: state.identity.verification_status === 'verified' || state.identity.verification_status === 'premium',
  };
}

// Standalone refresh function for non-component usage
export async function refreshIdentity() {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user?.id;
  if (userId) {
    await refreshGlobalState(userId);
  }
}
