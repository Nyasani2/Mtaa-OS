import { useAuthStore } from './useAuthStore';

export function useAuth() {
  const store = useAuthStore();
  return {
    user: store.user,
    session: store.session,
    loading: store.loading,
    signIn: store.signIn,
    signOut: store.signOut,
    isAuthenticated: !!store.session
  };
}
