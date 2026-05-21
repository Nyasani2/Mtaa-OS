'use client'
import { useEffect, useState } from 'react'
import { TreasuryExpenditure } from '../types/payments.types'
import { fetchExpenditures, createExpenditure, approveExpenditure, processExpenditure, markPaid } from '../services/expenditureService'

export function useExpenditures(status?: string) {
  const [expenditures, setExpenditures] = useState<TreasuryExpenditure[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchExpenditures(status).then(setExpenditures).finally(() => setLoading(false)) }, [status])

  const create = async (exp: Omit<TreasuryExpenditure, 'id' | 'created_at'>) => {
    const created = await createExpenditure(exp)
    setExpenditures(prev => [created, ...prev])
    return created
  }

  const approve = async (id: string, approverId: string) => {
    await approveExpenditure(id, approverId)
    setExpenditures(prev => prev.map(e => e.id === id ? { ...e, status: 'approved', approved_by: approverId } : e))
  }

  const process = async (id: string) => {
    await processExpenditure(id)
    setExpenditures(prev => prev.map(e => e.id === id ? { ...e, status: 'processed', processed_at: new Date().toISOString() } : e))
  }

  const pay = async (id: string) => {
    await markPaid(id)
    setExpenditures(prev => prev.map(e => e.id === id ? { ...e, status: 'paid', paid_at: new Date().toISOString() } : e))
  }

  return { expenditures, loading, create, approve, process, pay }
}
