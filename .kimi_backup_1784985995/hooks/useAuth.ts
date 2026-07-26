import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useCallback } from 'react';

export function useAuth() {
  const { user, session, profile, isLoading, signIn, signUp, signOut, refreshSession } = useAuthStore();

  const isAuthenticated = !!user && !!session;
  const userId = user?.id || null;

  const requireAuth = useCallback((action: () => void) => {
    if (isAuthenticated) {
      action();
    } else {
      console.warn('Auth required');
    }
  }, [isAuthenticated]);

  return {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated,
    userId,
    signIn,
    signUp,
    signOut,
    refreshSession,
    requireAuth,
  };
}
