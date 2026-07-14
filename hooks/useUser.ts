import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface UserData {
  id: string | null;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useUser(): { user: UserData | null } {
  const { user, profile, isAuthenticated, isLoading } = useAuthStore();
  if (!user) return { user: null };
  return {
    user: {
      id: user.id ?? null,
      email: user.email ?? null,
      phone: profile?.phone ?? null,
      full_name: profile?.full_name ?? profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      role: profile?.role ?? null,
      isAuthenticated,
      isLoading,
    },
  };
}

export default useUser;
