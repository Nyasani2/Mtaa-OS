import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useAdmin() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => (state as any).profile);
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';

  return {
    user,
    profile,
    isAdmin,
    isSuperAdmin: profile?.role === 'superadmin',
  };
}
