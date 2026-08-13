import { useAuthStore } from '@/lib/auth/store/auth.store';

export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.user,
    session: store.session,
    profile: store.profile,
    isLoading: store.isLoading,
    isAuthenticated: store.isAuthenticated,
    signOut: store.signOut,
    refreshSession: store.refreshSession,
  };
};
