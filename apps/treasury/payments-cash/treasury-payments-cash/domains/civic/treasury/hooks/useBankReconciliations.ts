'use client'
import { useEffect, useState } from 'react'
import { BankReconciliation } from '../types/payments.types'
import { fetchReconciliations, createReconciliation, resolveReconciliation } from '../services/reconciliationService'

export function useBankReconciliations(accountId?: string) {
  const [reconciliations, setReconciliations] = useState<BankReconciliation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchReconciliations(accountId).then(setReconciliations).finally(() => setLoading(false)) }, [accountId])

  const create = async (rec: Omit<BankReconciliation, 'id' | 'created_at'>) => {
    const created = await createReconciliation(rec)
    setReconciliations(prev => [created, ...prev])
    return created
  }

  const resolve = async (id: string, resolverId: string) => {
    await resolveReconciliation(id, resolverId)
    setReconciliations(prev => prev.map(r => r.id === id ? { ...r, status: 'resolved', reconciled_by: resolverId } : r))
  }

  return { reconciliations, loading, create, resolve }
}
