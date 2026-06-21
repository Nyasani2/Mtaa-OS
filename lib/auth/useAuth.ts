import { useAuthStore } from './store/auth.store';

export function useAuth() {
  const store = useAuthStore();

  return {
    user: store.user,
    session: store.session,
    profile: store.profile,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    initialized: store.initialized,

    // Identity
    displayName: store.getDisplayName(),
    avatarUrl: store.getAvatarUrl(),
    initials: store.getUserInitials(),
    role: store.getUserRole(),
    trustScore: store.getTrustScore(),

    // Actions
    initialize: store.initialize,
    signOut: store.signOut,
    setProfile: store.setProfile,
    updateProfileField: store.updateProfileField,
  };
}

export function useIdentity() {
  return useAuth();
}

export { useAuthStore };
