'use client'
import { useEffect, useState } from 'react'
import { BudgetCommitment, BudgetLiquidation } from '../types/budget.types'
import { fetchCommitments, createCommitment, liquidateCommitment, cancelCommitment } from '../services/commitmentService'

export function useCommitments(warrantId?: string) {
  const [commitments, setCommitments] = useState<BudgetCommitment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchCommitments(warrantId).then(setCommitments).finally(() => setLoading(false)) }, [warrantId])

  const create = async (commitment: Omit<BudgetCommitment, 'id' | 'liquidated_amount' | 'remaining_amount' | 'created_at'>) => {
    const created = await createCommitment(commitment)
    setCommitments(prev => [created, ...prev])
    return created
  }

  const liquidate = async (liquidation: Omit<BudgetLiquidation, 'id'>) => {
    const created = await liquidateCommitment(liquidation)
    setCommitments(prev => prev.map(c => c.id === liquidation.commitment_id ? {
      ...c, liquidated_amount: c.liquidated_amount + liquidation.amount,
      remaining_amount: c.remaining_amount - liquidation.amount,
      status: c.remaining_amount - liquidation.amount <= 0 ? 'liquidated' : c.status
    } : c))
    return created
  }

  const cancel = async (id: string) => {
    await cancelCommitment(id)
    setCommitments(prev => prev.map(c => c.id === id ? { ...c, status: 'cancelled' } : c))
  }

  return { commitments, loading, create, liquidate, cancel }
}
