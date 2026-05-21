'use client'
import { useEffect, useState } from 'react'
import { TreasuryContract } from '../types/procurement.types'
import { fetchContracts, createContract, updateContractProgress, ratePerformance, updateContractStatus } from '../services/contractService'

export function useContracts() {
  const [contracts, setContracts] = useState<TreasuryContract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchContracts().then(setContracts).finally(() => setLoading(false)) }, [])

  const create = async (contract: Omit<TreasuryContract, 'id' | 'payment_progress' | 'time_progress' | 'created_at'>) => {
    const created = await createContract(contract)
    setContracts(prev => [created, ...prev])
    return created
  }

  const updateProgress = async (id: string, payment: number, time: number) => {
    await updateContractProgress(id, payment, time)
    setContracts(prev => prev.map(c => c.id === id ? { ...c, payment_progress: payment, time_progress: time } : c))
  }

  const rate = async (id: string, rating: number) => {
    await ratePerformance(id, rating)
    setContracts(prev => prev.map(c => c.id === id ? { ...c, performance_rating: rating } : c))
  }

  const updateStatus = async (id: string, status: TreasuryContract['status']) => {
    await updateContractStatus(id, status)
    setContracts(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  return { contracts, loading, create, updateProgress, rate, updateStatus }
}
