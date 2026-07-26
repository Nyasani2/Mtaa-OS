import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useUser() {
  const { user, profile, isAuthenticated, isLoading } = useAuthStore();
  return { user, profile, isAuthenticated, isLoading };
}
