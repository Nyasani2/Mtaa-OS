// hooks/useAuthStore.ts
import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';

interface AuthStoreState {
  session: Session | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  session: null,
  isLoading: true,
  setSession: (session) => set({ session, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
  signOut: () => set({ session: null, isLoading: false }),
}));
