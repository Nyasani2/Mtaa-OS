import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth/store/auth.store';

// Safe import for pin-engine — handles missing functions gracefully
let getPinState: () => Promise<{ isSet: boolean; isLocked: boolean; attemptsRemaining: number }>;
try {
 
  const pinEngine = require('@/lib/security/pin-engine');
  getPinState = pinEngine.getPinState || pinEngine.getPinStatus || (async () => ({ isSet: false, isLocked: false, attemptsRemaining: 5 }));
} catch {
  getPinState = async () => ({ isSet: false, isLocked: false, attemptsRemaining: 5 });
}

export function useIdentity() {
  const store = useAuthStore();
  const [pinState, setPinState] = useState({
    isSet: false,
    isLocked: false,
    attemptsRemaining: 5,
  });

  useEffect(() => {
    let mounted = true;
    getPinState().then((state) => {
      if (mounted) {
        setPinState({
          isSet: state.isSet,
          isLocked: state.isLocked,
          attemptsRemaining: state.attemptsRemaining,
        });
      }
    }).catch(() => {
      // PIN engine not available — safe fallback
    });
    return () => { mounted = false; };
  }, [store.user?.id]);

  const refreshProfile = useCallback(async () => {
    await store.refreshProfile();
  }, [store.refreshProfile]);

  const signOut = useCallback(async () => {
    await store.signOut();
  }, [store.signOut]);

  return {
    user: store.user,
    session: store.session,
    profile: store.profile,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    initialized: store.initialized,
    isPinSet: pinState.isSet,
    isPinLocked: pinState.isLocked,
    pinAttemptsRemaining: pinState.attemptsRemaining,
    displayName: store.getDisplayName?.() || store.user?.email?.split('@')[0] || 'User',
    avatarUrl: store.getAvatarUrl?.() || null,
    userRole: store.getUserRole?.() || 'user',
    refreshProfile,
    signOut,
  };
}