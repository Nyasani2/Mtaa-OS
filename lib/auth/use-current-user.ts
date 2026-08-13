import { useAuthStore } from './store/auth.store';

/**
 * Unified hook for ALL MTAA apps to recognize the logged-in user.
 * Every app screen MUST use this — never import auth from random paths.
 */
export function useCurrentUser() {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pinSet = useAuthStore((s) => s.pinSet);

  return {
    user,
    userId: user?.id ?? null,
    email: user?.email ?? null,
    session,
    isLoading,
    isAuthenticated,
    isReady: !isLoading,
    hasPin: pinSet,
  };
}
