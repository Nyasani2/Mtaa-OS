'use client'
import { useEffect, useState } from 'react'
import { RevenueCollection } from '../types/payments.types'
import { fetchRevenueCollections, createRevenueCollection, confirmRevenueCollection } from '../services/revenueService'

export function useRevenueCollections(source?: string) {
  const [collections, setCollections] = useState<RevenueCollection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchRevenueCollections(source).then(setCollections).finally(() => setLoading(false)) }, [source])

  const create = async (rev: Omit<RevenueCollection, 'id' | 'created_at'>) => {
    const created = await createRevenueCollection(rev)
    setCollections(prev => [created, ...prev])
    return created
  }

  const confirm = async (id: string) => {
    await confirmRevenueCollection(id)
    setCollections(prev => prev.map(c => c.id === id ? { ...c, status: 'confirmed', confirmed_at: new Date().toISOString() } : c))
  }

  return { collections, loading, create, confirm }
}
