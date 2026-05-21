'use client'
import { useEffect, useState } from 'react'
import { DebtPayment } from '../types/debtPayroll.types'
import { fetchUpcomingPayments, recordPayment, waivePayment } from '../services/debtPaymentService'

export function useDebtPayments(days = 90) {
  const [payments, setPayments] = useState<DebtPayment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchUpcomingPayments(days).then(setPayments).finally(() => setLoading(false)) }, [days])

  const pay = async (id: string) => {
    await recordPayment(id)
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'paid', paid_at: new Date().toISOString() } : p))
  }

  const waive = async (id: string) => {
    await waivePayment(id)
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'waived' } : p))
  }

  return { payments, loading, pay, waive }
}
