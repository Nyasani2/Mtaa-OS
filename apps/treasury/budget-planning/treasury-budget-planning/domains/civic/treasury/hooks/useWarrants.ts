'use client'
import { useEffect, useState } from 'react'
import { BudgetWarrant } from '../types/budget.types'
import { fetchWarrants, issueWarrant, cancelWarrant } from '../services/warrantService'

export function useWarrants(allocationId?: string) {
  const [warrants, setWarrants] = useState<BudgetWarrant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchWarrants(allocationId).then(setWarrants).finally(() => setLoading(false)) }, [allocationId])

  const issue = async (warrant: Omit<BudgetWarrant, 'id' | 'spent_amount' | 'remaining_amount' | 'issued_at'>) => {
    const created = await issueWarrant(warrant)
    setWarrants(prev => [created, ...prev])
    return created
  }

  const cancel = async (id: string) => {
    await cancelWarrant(id)
    setWarrants(prev => prev.map(w => w.id === id ? { ...w, status: 'cancelled' } : w))
  }

  return { warrants, loading, issue, cancel }
}
