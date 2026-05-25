// hooks/useAuth.ts
import { useIdentity } from '@/lib/auth/identity';
import { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth(): AuthState {
  const { user, session, isLoading, isAuthenticated } = useIdentity();
  return { user, session, isLoading, isAuthenticated };
}

export default useAuth;
