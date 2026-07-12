import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { getPinState } from '@/lib/security/pin-engine';

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
    displayName: store.getDisplayName(),
    avatarUrl: store.getAvatarUrl(),
    userRole: store.getUserRole(),
    refreshProfile,
    signOut,
  };
}
