import { create } from 'zustand'

type AppState = {
  activeApp: string | null
  setActiveApp: (id: string | null) => void
}

export const useOSAppState = create<AppState>((set) => ({
  activeApp: null,
  setActiveApp: (id) => set({ activeApp: id }),
}))
