import { create } from 'zustand'
import { ProcurementRequisition, TreasuryTender, TreasuryContract, TreasuryAsset, AssetTransfer } from '../types/procurement.types'

interface ProcurementState {
  requisitions: ProcurementRequisition[]
  tenders: TreasuryTender[]
  contracts: TreasuryContract[]
  assets: TreasuryAsset[]
  transfers: AssetTransfer[]
  selectedRequisition: string | null
  selectedTender: string | null
  selectedContract: string | null
  selectedAsset: string | null
  setRequisitions: (r: ProcurementRequisition[]) => void
  setTenders: (t: TreasuryTender[]) => void
  setContracts: (c: TreasuryContract[]) => void
  setAssets: (a: TreasuryAsset[]) => void
  setTransfers: (t: AssetTransfer[]) => void
  selectRequisition: (id: string | null) => void
  selectTender: (id: string | null) => void
  selectContract: (id: string | null) => void
  selectAsset: (id: string | null) => void
}

export const useProcurementStore = create<ProcurementState>((set) => ({
  requisitions: [], tenders: [], contracts: [], assets: [], transfers: [],
  selectedRequisition: null, selectedTender: null, selectedContract: null, selectedAsset: null,
  setRequisitions: (r) => set({ requisitions: r }),
  setTenders: (t) => set({ tenders: t }),
  setContracts: (c) => set({ contracts: c }),
  setAssets: (a) => set({ assets: a }),
  setTransfers: (t) => set({ transfers: t }),
  selectRequisition: (id) => set({ selectedRequisition: id }),
  selectTender: (id) => set({ selectedTender: id }),
  selectContract: (id) => set({ selectedContract: id }),
  selectAsset: (id) => set({ selectedAsset: id })
}))
