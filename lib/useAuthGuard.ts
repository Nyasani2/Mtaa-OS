// lib/useAuthGuard.ts
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useAuthGuard(requiredRole?: string) {
  const identity = useAuthStore();

  return {
    isAllowed: identity.isAuthenticated && (!requiredRole || (identity.user as any)?.role === requiredRole),
    isAuthenticated: identity.isAuthenticated,
    isLoading: identity.isLoading,
    user: identity.user,
  };
}
