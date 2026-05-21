'use client'
import { useEffect, useState } from 'react'
import { TsaTransaction } from '../types/payments.types'
import { fetchTsaTransactions, createTsaTransaction } from '../services/tsaService'

export function useTsaTransactions(accountId?: string) {
  const [transactions, setTransactions] = useState<TsaTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchTsaTransactions(accountId).then(setTransactions).finally(() => setLoading(false)) }, [accountId])

  const create = async (txn: Omit<TsaTransaction, 'id' | 'created_at'>) => {
    const created = await createTsaTransaction(txn)
    setTransactions(prev => [created, ...prev])
    return created
  }

  return { transactions, loading, create }
}
