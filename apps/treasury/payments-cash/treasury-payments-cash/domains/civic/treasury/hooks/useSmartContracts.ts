'use client'
import { useEffect, useState } from 'react'
import { TreasurySmartContract } from '../types/payments.types'
import { fetchSmartContracts, createSmartContract, deployContract, updateContractStatus } from '../services/smartContractService'

export function useSmartContracts() {
  const [contracts, setContracts] = useState<TreasurySmartContract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchSmartContracts().then(setContracts).finally(() => setLoading(false)) }, [])

  const create = async (contract: Omit<TreasurySmartContract, 'id' | 'created_at'>) => {
    const created = await createSmartContract(contract)
    setContracts(prev => [created, ...prev])
    return created
  }

  const deploy = async (id: string, deployerId: string) => {
    await deployContract(id, deployerId)
    setContracts(prev => prev.map(c => c.id === id ? { ...c, status: 'deployed', deployed_by: deployerId } : c))
  }

  const updateStatus = async (id: string, status: TreasurySmartContract['status']) => {
    await updateContractStatus(id, status)
    setContracts(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  return { contracts, loading, create, deploy, updateStatus }
}
