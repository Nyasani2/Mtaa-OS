import { create } from 'zustand'
import { BudgetCycle, BudgetAllocation, BudgetWarrant, BudgetCommitment, ApprovalHierarchy, Delegation } from '../types/budget.types'

interface BudgetState {
  cycles: BudgetCycle[]
  allocations: BudgetAllocation[]
  warrants: BudgetWarrant[]
  commitments: BudgetCommitment[]
  hierarchy: ApprovalHierarchy[]
  delegations: Delegation[]
  selectedCycle: string | null
  selectedAllocation: string | null
  selectedWarrant: string | null
  setCycles: (c: BudgetCycle[]) => void
  setAllocations: (a: BudgetAllocation[]) => void
  setWarrants: (w: BudgetWarrant[]) => void
  setCommitments: (c: BudgetCommitment[]) => void
  setHierarchy: (h: ApprovalHierarchy[]) => void
  setDelegations: (d: Delegation[]) => void
  selectCycle: (id: string | null) => void
  selectAllocation: (id: string | null) => void
  selectWarrant: (id: string | null) => void
}

export const useBudgetStore = create<BudgetState>((set) => ({
  cycles: [], allocations: [], warrants: [], commitments: [], hierarchy: [], delegations: [],
  selectedCycle: null, selectedAllocation: null, selectedWarrant: null,
  setCycles: (c) => set({ cycles: c }),
  setAllocations: (a) => set({ allocations: a }),
  setWarrants: (w) => set({ warrants: w }),
  setCommitments: (c) => set({ commitments: c }),
  setHierarchy: (h) => set({ hierarchy: h }),
  setDelegations: (d) => set({ delegations: d }),
  selectCycle: (id) => set({ selectedCycle: id }),
  selectAllocation: (id) => set({ selectedAllocation: id }),
  selectWarrant: (id) => set({ selectedWarrant: id })
}))
