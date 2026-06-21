import { useAuthStore } from '@/lib/auth/useAuthStore';

export function useAdmin() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return {
    isAdmin,
    user,
  };
}
