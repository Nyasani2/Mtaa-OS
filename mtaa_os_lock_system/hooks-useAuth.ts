import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useAuth() {
  const store = useAuthStore();
  return {
    user: store.user,
    session: store.session,
    profile: store.profile,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    initialized: store.initialized,
    displayName: store.getDisplayName(),
    avatarUrl: store.getAvatarUrl(),
    userRole: store.getUserRole(),
    trustScore: store.getTrustScore(),
    signIn: store.signIn,
    signUp: store.signUp,
    signOut: store.signOut,
    resetPassword: store.resetPassword,
    updateProfile: store.updateProfile,
    refreshProfile: store.refreshProfile,
  };
}

export { useAuthStore } from '@/lib/auth/store/auth.store';
