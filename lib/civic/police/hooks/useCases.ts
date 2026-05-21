import { useState, useEffect, useCallback } from 'react'
import { caseService } from '../services/caseService'
import { PoliceCase, CaseFilter, CaseStatus } from '../types/police.types'

export function useCases(initialFilter: CaseFilter = {}) {
  const [cases, setCases] = useState<PoliceCase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<CaseFilter>(initialFilter)

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await caseService.getCases(filter)
      setCases(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cases')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  const createCase = async (caseData: Partial<PoliceCase>) => {
    try {
      const newCase = await caseService.createCase(caseData)
      setCases(prev => [newCase, ...prev])
      return newCase
    } catch (err: any) {
      setError(err.message || 'Failed to create case')
      throw err
    }
  }

  const updateStatus = async (caseId: string, status: CaseStatus, notes?: string) => {
    try {
      await caseService.updateCaseStatus(caseId, status, notes)
      setCases(prev => prev.map(c => 
        c.id === caseId ? { ...c, status } : c
      ))
    } catch (err: any) {
      setError(err.message || 'Failed to update status')
      throw err
    }
  }

  const assignOfficer = async (caseId: string, officerId: string) => {
    try {
      await caseService.assignOfficer(caseId, officerId)
      setCases(prev => prev.map(c => 
        c.id === caseId ? { ...c, assigned_officer_id: officerId, status: 'under_investigation' } : c
      ))
    } catch (err: any) {
      setError(err.message || 'Failed to assign officer')
      throw err
    }
  }

  return {
    cases,
    loading,
    error,
    filter,
    setFilter,
    refresh: fetchCases,
    createCase,
    updateStatus,
    assignOfficer
  }
}
