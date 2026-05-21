'use client'
import { useEffect, useState } from 'react'
import { TreasuryTender } from '../types/procurement.types'
import { fetchTenders, createTender, publishTender, awardTender, cancelTender } from '../services/tenderService'

export function useTenders() {
  const [tenders, setTenders] = useState<TreasuryTender[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchTenders().then(setTenders).finally(() => setLoading(false)) }, [])

  const create = async (tender: Omit<TreasuryTender, 'id' | 'bid_count' | 'created_at'>) => {
    const created = await createTender(tender)
    setTenders(prev => [created, ...prev])
    return created
  }

  const publish = async (id: string) => {
    await publishTender(id)
    setTenders(prev => prev.map(t => t.id === id ? { ...t, status: 'published' } : t))
  }

  const award = async (id: string) => {
    await awardTender(id)
    setTenders(prev => prev.map(t => t.id === id ? { ...t, status: 'awarded' } : t))
  }

  const cancel = async (id: string) => {
    await cancelTender(id)
    setTenders(prev => prev.map(t => t.id === id ? { ...t, status: 'cancelled' } : t))
  }

  return { tenders, loading, create, publish, award, cancel }
}
