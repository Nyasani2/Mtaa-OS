// lib/stores/auth-store.ts

import { create } from 'zustand';

type AuthState = {
  user: any | null;
  session: any | null;
  hydrated: boolean;

  setUser: (user: any | null) => void;
  setSession: (session: any | null) => void;
  setHydrated: (v: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  hydrated: false,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setHydrated: (hydrated) => set({ hydrated }),
}));
