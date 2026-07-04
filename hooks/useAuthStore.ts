import { create } from 'zustand';

interface AuthState {
  user: any;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: false,
  signIn: async () => {},
  signOut: async () => { set({ user: null, session: null }); }
}));
