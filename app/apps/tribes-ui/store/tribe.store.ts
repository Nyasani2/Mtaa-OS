import { create } from "zustand";

type TribeState = {
  activeTribe: any | null;
  setActiveTribe: (t: any) => void;

  role: "member" | "elder" | "leader";
  setRole: (r: any) => void;
};

export const useTribeStore = create<TribeState>((set) => ({
  activeTribe: null,
  setActiveTribe: (t) => set({ activeTribe: t }),

  role: "member",
  setRole: (r) => set({ role: r })
}));
