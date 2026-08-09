import { useAuthStore } from '@/lib/auth/store/auth.store';

/**
 * Canonical auth hook wrapper for education screens.
 * All education screens import from @/hooks/useAuth — this is the bridge.
 */
export function useAuth() {
  const store = useAuthStore();
  return {
    user: store.user,
    profile: store.profile,
    isLoading: store.isLoading,
    isAuthenticated: store.isAuthenticated,
    login: store.login,
    logout: store.logout,
    refreshSession: store.refreshSession,
  };
}
