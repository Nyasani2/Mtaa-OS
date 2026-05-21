import { create } from 'zustand'
import { DebtInstrument, DebtPayment, PayrollCycle, PayrollEntry, CashForecast, RevenueForecast } from '../types/debtPayroll.types'

interface DebtPayrollState {
  instruments: DebtInstrument[]
  payments: DebtPayment[]
  payrollCycles: PayrollCycle[]
  payrollEntries: PayrollEntry[]
  cashForecasts: CashForecast[]
  revenueForecasts: RevenueForecast[]
  selectedInstrument: string | null
  selectedCycle: string | null
  setInstruments: (i: DebtInstrument[]) => void
  setPayments: (p: DebtPayment[]) => void
  setPayrollCycles: (c: PayrollCycle[]) => void
  setPayrollEntries: (e: PayrollEntry[]) => void
  setCashForecasts: (f: CashForecast[]) => void
  setRevenueForecasts: (f: RevenueForecast[]) => void
  selectInstrument: (id: string | null) => void
  selectCycle: (id: string | null) => void
}

export const useDebtPayrollStore = create<DebtPayrollState>((set) => ({
  instruments: [], payments: [], payrollCycles: [], payrollEntries: [], cashForecasts: [], revenueForecasts: [],
  selectedInstrument: null, selectedCycle: null,
  setInstruments: (i) => set({ instruments: i }),
  setPayments: (p) => set({ payments: p }),
  setPayrollCycles: (c) => set({ payrollCycles: c }),
  setPayrollEntries: (e) => set({ payrollEntries: e }),
  setCashForecasts: (f) => set({ cashForecasts: f }),
  setRevenueForecasts: (f) => set({ revenueForecasts: f }),
  selectInstrument: (id) => set({ selectedInstrument: id }),
  selectCycle: (id) => set({ selectedCycle: id })
}))
