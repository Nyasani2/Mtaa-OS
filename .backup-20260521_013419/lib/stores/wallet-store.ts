import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type WalletState = {
  balance: number
  currency: string
  loading: boolean
  lastTransaction?: string

  setBalance: (amount: number) => void
  updateBalance: (delta: number) => void
  setLoading: (state: boolean) => void
  setLastTransaction: (id: string) => void
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: 0,
      currency: 'KES',
      loading: false,

      setBalance: (amount) => set({ balance: amount }),

      updateBalance: (delta) =>
        set({ balance: get().balance + delta }),

      setLoading: (state) => set({ loading: state }),

      setLastTransaction: (id) =>
        set({ lastTransaction: id }),
    }),
    {
      name: 'mtaa-wallet-store',
    }
  )
)
