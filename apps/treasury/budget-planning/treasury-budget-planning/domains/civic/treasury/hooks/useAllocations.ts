'use client'
import { useEffect, useState } from 'react'
import { BudgetAllocation } from '../types/budget.types'
import { fetchAllocations, createAllocation, reviseAllocation } from '../services/allocationService'

export function useAllocations(cycleId?: string) {
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAllocations(cycleId).then(setAllocations).finally(() => setLoading(false)) }, [cycleId])

  const create = async (allocation: Omit<BudgetAllocation, 'id' | 'available_balance' | 'utilization_rate' | 'created_at'>) => {
    const created = await createAllocation(allocation)
    setAllocations(prev => [created, ...prev])
    return created
  }

  const revise = async (id: string, amount: number) => {
    await reviseAllocation(id, amount)
    setAllocations(prev => prev.map(a => a.id === id ? { ...a, revised_amount: amount } : a))
  }

  return { allocations, loading, create, revise }
}
