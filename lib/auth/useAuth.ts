import { useCallback } from 'react';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useRouter } from 'expo-router';

export function useAuth() {
  const store = useAuthStore();
  const router = useRouter();

  const login = useCallback(async (email: string, password: string) => {
    const result = await store.signIn(email, password);
    if (!result.error) {
      router.replace('/(os)');
    }
    return result;
  }, [store.signIn, router]);

  const register = useCallback(async (email: string, password: string, metadata?: Record<string, unknown>) => {
    const result = await store.signUp(email, password, metadata);
    return result;
  }, [store.signUp]);

  const logout = useCallback(async () => {
    await store.signOut();
    router.replace('/auth/login');
  }, [store.signOut, router]);

  return {
    user: store.user,
    session: store.session,
    profile: store.profile,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    initialized: store.initialized,
    displayName: store.getDisplayName?.() || store.user?.email?.split('@')[0] || 'User',
    avatarUrl: store.getAvatarUrl?.() || null,
    userRole: store.getUserRole?.() || 'user',
    trustScore: store.getTrustScore?.() || 0,
    login,
    register,
    logout,
    signIn: store.signIn,
    signUp: store.signUp,
    signOut: store.signOut,
    resetPassword: store.resetPassword,
    updateProfile: store.updateProfile,
    refreshProfile: store.refreshProfile,
  };
}

// Re-export for barrel compatibility
export { useAuthStore } from '@/lib/auth/store/auth.store';
export { useIdentity } from './use-identity';
