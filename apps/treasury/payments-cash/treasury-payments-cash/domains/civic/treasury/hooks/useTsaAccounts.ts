'use client'
import { useEffect, useState } from 'react'
import { TsaAccount } from '../types/payments.types'
import { fetchTsaAccounts } from '../services/tsaService'

export function useTsaAccounts() {
  const [accounts, setAccounts] = useState<TsaAccount[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetchTsaAccounts().then(setAccounts).finally(() => setLoading(false)) }, [])
  return { accounts, loading }
}
