'use client'
import { useEffect, useState } from 'react'
import { DebtInstrument } from '../types/debtPayroll.types'
import { fetchDebtInstruments, createDebtInstrument, updateDebtStatus, schedulePayments } from '../services/debtInstrumentService'

export function useDebtInstruments() {
  const [instruments, setInstruments] = useState<DebtInstrument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchDebtInstruments().then(setInstruments).finally(() => setLoading(false)) }, [])

  const create = async (inst: Omit<DebtInstrument, 'id' | 'outstanding_principal' | 'total_interest_paid' | 'created_at'>) => {
    const created = await createDebtInstrument(inst)
    setInstruments(prev => [...prev, created])
    return created
  }

  const updateStatus = async (id: string, status: DebtInstrument['status']) => {
    await updateDebtStatus(id, status)
    setInstruments(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  const schedule = async (id: string) => {
    await schedulePayments(id)
  }

  return { instruments, loading, create, updateStatus, schedule }
}
