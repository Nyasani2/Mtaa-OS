'use client'
import { useEffect, useState } from 'react'
import { BudgetCycle } from '../types/budget.types'
import { fetchBudgetCycles, createBudgetCycle, updateBudgetCycleStatus, closeBudgetCycle } from '../services/budgetCycleService'

export function useBudgetCycles() {
  const [cycles, setCycles] = useState<BudgetCycle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchBudgetCycles().then(setCycles).finally(() => setLoading(false)) }, [])

  const create = async (cycle: Omit<BudgetCycle, 'id' | 'created_at' | 'updated_at'>) => {
    const created = await createBudgetCycle(cycle)
    setCycles(prev => [created, ...prev])
    return created
  }

  const updateStatus = async (id: string, status: BudgetCycle['status']) => {
    await updateBudgetCycleStatus(id, status)
    setCycles(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  const close = async (id: string) => {
    await closeBudgetCycle(id)
    setCycles(prev => prev.map(c => c.id === id ? { ...c, status: 'closed' } : c))
  }

  return { cycles, loading, create, updateStatus, close }
}
