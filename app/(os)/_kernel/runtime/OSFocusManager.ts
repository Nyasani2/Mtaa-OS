import { create } from 'zustand'

type FocusState = {
  activeAppId: string | null
  previousAppId: string | null

  setActiveApp: (id: string | null) => void
  clearFocus: () => void
}

export const useOSFocusManager = create<FocusState>((set, get) => ({
  activeAppId: null,
  previousAppId: null,

  setActiveApp: (id) => {
    set({
      previousAppId: get().activeAppId,
      activeAppId: id,
    })
  },

  clearFocus: () => {
    set({
      previousAppId: get().activeAppId,
      activeAppId: null,
    })
  },
}))
