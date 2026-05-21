import { create } from 'zustand'

type StackState = {
  stack: string[]

  push: (id: string) => void
  pop: () => string | undefined
  reset: () => void
}

export const useOSAppStack = create<StackState>((set, get) => ({
  stack: [],

  push: (id) => {
    set({ stack: [...get().stack, id] })
  },

  pop: () => {
    const stack = get().stack
    const last = stack[stack.length - 1]

    set({ stack: stack.slice(0, -1) })

    return last
  },

  reset: () => set({ stack: [] }),
}))
