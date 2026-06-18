import { useAuthStore } from '@/lib/auth/useAuthStore';

export function useAdmin() {
  const { user } = useAuthStore();
  return {
    isAdmin: user?.role === 'admin',
    user,
  };
}
