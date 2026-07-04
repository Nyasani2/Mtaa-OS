import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useAuth() {
  const store = useAuthStore();
  return {
    user: store.user,
    session: store.session,
    loading: store.isLoading,
    signOut: store.signOut,
    isAuthenticated: !!store.session
  };
}

export { useAuthStore } from '@/lib/auth/store/auth.store';
