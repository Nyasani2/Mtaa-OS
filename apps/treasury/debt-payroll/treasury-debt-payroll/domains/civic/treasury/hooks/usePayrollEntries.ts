'use client'
import { useEffect, useState } from 'react'
import { PayrollEntry } from '../types/debtPayroll.types'
import { fetchPayrollEntries, createPayrollEntry, verifyBiometric, approveEntry } from '../services/payrollEntryService'

export function usePayrollEntries(cycleId: string) {
  const [entries, setEntries] = useState<PayrollEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchPayrollEntries(cycleId).then(setEntries).finally(() => setLoading(false)) }, [cycleId])

  const create = async (entry: Omit<PayrollEntry, 'id' | 'gross_pay' | 'total_deductions' | 'net_pay' | 'created_at'>) => {
    const created = await createPayrollEntry(entry)
    setEntries(prev => [...prev, created])
    return created
  }

  const verifyBio = async (id: string) => {
    await verifyBiometric(id)
    setEntries(prev => prev.map(e => e.id === id ? { ...e, biometric_verified: true } : e))
  }

  const approve = async (id: string) => {
    await approveEntry(id)
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'approved' } : e))
  }

  return { entries, loading, create, verifyBiometric: verifyBio, approve }
}
