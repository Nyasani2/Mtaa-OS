import { create } from "zustand";

type User = {
  id: string;
  email?: string;
};

type AuthState = {
  user: User | null;
  hydrated: boolean;

  setUser: (user: User | null) => void;
  setHydrated: (value: boolean) => void;

  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,

  setUser: (user) => set({ user }),

  setHydrated: (value) => set({ hydrated: value }),

  logout: () => set({ user: null, hydrated: false }),
}));
