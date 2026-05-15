import { create } from "zustand";

type TribeState = {
  activeTribe: any | null;
  setActiveTribe: (t: any) => void;

  adminMode: boolean;
  setAdminMode: (v: boolean) => void;
};

export const useTribeStore = create<TribeState>((set) => ({
  activeTribe: null,
  setActiveTribe: (t) => set({ activeTribe: t }),

  adminMode: false,
  setAdminMode: (v) => set({ adminMode: v }),
}));
