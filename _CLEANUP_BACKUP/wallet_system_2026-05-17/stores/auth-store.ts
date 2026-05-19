import { create } from 'zustand';

type User = {
  id: string;
  email?: string;
};

type AuthState = {
  user: User | null;
  setUser: (u: User | null) => void;
  signOut: () => void;
};

/**
 * MTAA SINGLE AUTH KERNEL
 * DO NOT DUPLICATE OR WRAP THIS ANYWHERE ELSE
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  setUser: (user) => set({ user }),

  signOut: () =>
    set({
      user: null,
    }),
}));
