import { create } from 'zustand';

type User = {
  id: string;
  email?: string;
};

type AuthState = {
  user: User | null;
  role: string | null;
  accountType: string | null;

  setUser: (user: User | null) => void;
  setRole: (role: string | null) => void;
  setAccountType: (type: string | null) => void;

  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  role: 'citizen',

  accountType: 'standard',

  setUser: (user) =>
    set({
      user,
    }),

  setRole: (role) =>
    set({
      role,
    }),

  setAccountType: (accountType) =>
    set({
      accountType,
    }),

  logout: () =>
    set({
      user: null,
      role: null,
      accountType: null,
    }),
}));
