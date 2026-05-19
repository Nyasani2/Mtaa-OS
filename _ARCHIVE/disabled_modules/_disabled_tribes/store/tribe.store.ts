import { create } from "zustand";

type State = {
  selectedTribe: any | null;
  setSelectedTribe: (t: any) => void;
};

export const useTribeStore = create<State>((set) => ({
  selectedTribe: null,
  setSelectedTribe: (t) => set({ selectedTribe: t }),
}));
