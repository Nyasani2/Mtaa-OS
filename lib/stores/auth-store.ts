import { create } from "zustand";
import { identityEngine } from "@/lib/auth/identity";

/**
 * BRIDGE STORE (TEMP BUT STABLE)
 * Syncs Zustand with identityEngine
 */

type AuthState = {
  user: any | null;
  session: any | null;
  hydrated: boolean;

  setUser: (user: any | null) => void;
  setSession: (session: any | null) => void;
  setHydrated: (v: boolean) => void;
};

export const useAuthStore = create<AuthState>((set, get) => {
  // subscribe once to identity engine
  identityEngine.subscribe((state: any) => {
    set({
      user: state.user ?? null,
      session: state.session ?? null,
      hydrated: true,
    });
  });

  return {
    user: null,
    session: null,
    hydrated: false,

    setUser: (user) => {
      identityEngine.setUser?.(user);
      set({ user });
    },

    setSession: (session) => {
      identityEngine.setSession?.(session);
      set({ session });
    },

    setHydrated: (hydrated) => set({ hydrated }),
  };
});
