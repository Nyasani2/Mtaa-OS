import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useAuth() {
  const { user, session, isAuthenticated, isLoading, signIn, signUp, signOut } = useAuthStore();
  return { user, session, isAuthenticated, isLoading, signIn, signUp, signOut };
}
