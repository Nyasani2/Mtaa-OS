// lib/useAuthGuard.ts
import { useIdentity } from '@/lib/auth/identity';

export function useAuthGuard(requiredRole?: string) {
  const identity = useIdentity();

  return {
    isAllowed: identity.isAuthenticated && (!requiredRole || identity.user?.role === requiredRole),
    isAuthenticated: identity.isAuthenticated,
    isLoading: identity.isLoading,
    user: identity.user,
  };
}
