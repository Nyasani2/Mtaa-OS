'use client'
import { useEffect, useState } from 'react'
import { ProcurementRequisition } from '../types/procurement.types'
import { fetchRequisitions, createRequisition, submitRequisition, approveRequisition, convertToTender } from '../services/requisitionService'

export function useRequisitions() {
  const [requisitions, setRequisitions] = useState<ProcurementRequisition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchRequisitions().then(setRequisitions).finally(() => setLoading(false)) }, [])

  const create = async (req: Omit<ProcurementRequisition, 'id' | 'status' | 'created_at'>) => {
    const created = await createRequisition(req)
    setRequisitions(prev => [created, ...prev])
    return created
  }

  const submit = async (id: string) => {
    await submitRequisition(id)
    setRequisitions(prev => prev.map(r => r.id === id ? { ...r, status: 'submitted' } : r))
  }

  const approve = async (id: string, approverId: string) => {
    await approveRequisition(id, approverId)
    setRequisitions(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r))
  }

  const convert = async (id: string) => {
    await convertToTender(id)
    setRequisitions(prev => prev.map(r => r.id === id ? { ...r, status: 'converted_to_tender' } : r))
  }

  return { requisitions, loading, create, submit, approve, convert }
}
