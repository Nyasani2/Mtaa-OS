import { useState, useEffect, useCallback } from 'react'
import { officerService } from '../services/officerService'
import { PoliceOfficer } from '../types/police.types'

export function useOfficers(stationId?: string) {
  const [officers, setOfficers] = useState<PoliceOfficer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOfficers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await officerService.getOfficers(stationId)
      setOfficers(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch officers')
    } finally {
      setLoading(false)
    }
  }, [stationId])

  useEffect(() => {
    fetchOfficers()
  }, [fetchOfficers])

  const updateDutyStatus = async (officerId: string, status: string) => {
    try {
      await officerService.updateDutyStatus(officerId, status)
      setOfficers(prev => prev.map(o => 
        o.id === officerId ? { ...o, duty_status: status as any } : o
      ))
    } catch (err: any) {
      setError(err.message || 'Failed to update duty status')
      throw err
    }
  }

  return {
    officers,
    loading,
    error,
    refresh: fetchOfficers,
    updateDutyStatus
  }
}
