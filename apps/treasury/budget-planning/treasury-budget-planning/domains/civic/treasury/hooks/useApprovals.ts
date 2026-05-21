'use client'
import { useEffect, useState } from 'react'
import { ApprovalHierarchy, Delegation } from '../types/budget.types'
import { fetchApprovalHierarchy, createApprovalHierarchy, fetchDelegations, createDelegation, toggleDelegation } from '../services/approvalService'

export function useApprovals(module?: string) {
  const [hierarchy, setHierarchy] = useState<ApprovalHierarchy[]>([])
  const [delegations, setDelegations] = useState<Delegation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchApprovalHierarchy(module), fetchDelegations()])
      .then(([h, d]) => { setHierarchy(h); setDelegations(d) })
      .finally(() => setLoading(false))
  }, [module])

  const addHierarchy = async (h: Omit<ApprovalHierarchy, 'id' | 'created_at'>) => {
    const created = await createApprovalHierarchy(h)
    setHierarchy(prev => [...prev, created])
    return created
  }

  const addDelegation = async (d: Omit<Delegation, 'id' | 'created_at'>) => {
    const created = await createDelegation(d)
    setDelegations(prev => [created, ...prev])
    return created
  }

  const toggle = async (id: string, active: boolean) => {
    await toggleDelegation(id, active)
    setDelegations(prev => prev.map(d => d.id === id ? { ...d, is_active: active } : d))
  }

  return { hierarchy, delegations, loading, addHierarchy, addDelegation, toggleDelegation: toggle }
}
