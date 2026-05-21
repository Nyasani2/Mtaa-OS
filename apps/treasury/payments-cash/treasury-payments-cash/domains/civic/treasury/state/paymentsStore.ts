import { create } from 'zustand'
import { TreasuryExpenditure, TsaAccount, TsaTransaction, RevenueCollection, BankReconciliation, TreasurySmartContract } from '../types/payments.types'

interface PaymentsState {
  expenditures: TreasuryExpenditure[]
  tsaAccounts: TsaAccount[]
  tsaTransactions: TsaTransaction[]
  revenueCollections: RevenueCollection[]
  reconciliations: BankReconciliation[]
  smartContracts: TreasurySmartContract[]
  selectedAccount: string | null
  setExpenditures: (e: TreasuryExpenditure[]) => void
  setTsaAccounts: (a: TsaAccount[]) => void
  setTsaTransactions: (t: TsaTransaction[]) => void
  setRevenueCollections: (r: RevenueCollection[]) => void
  setReconciliations: (r: BankReconciliation[]) => void
  setSmartContracts: (c: TreasurySmartContract[]) => void
  selectAccount: (id: string | null) => void
}

export const usePaymentsStore = create<PaymentsState>((set) => ({
  expenditures: [], tsaAccounts: [], tsaTransactions: [], revenueCollections: [], reconciliations: [], smartContracts: [],
  selectedAccount: null,
  setExpenditures: (e) => set({ expenditures: e }),
  setTsaAccounts: (a) => set({ tsaAccounts: a }),
  setTsaTransactions: (t) => set({ tsaTransactions: t }),
  setRevenueCollections: (r) => set({ revenueCollections: r }),
  setReconciliations: (r) => set({ reconciliations: r }),
  setSmartContracts: (c) => set({ smartContracts: c }),
  selectAccount: (id) => set({ selectedAccount: id })
}))
