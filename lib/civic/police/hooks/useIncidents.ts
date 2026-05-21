import { useState, useEffect, useCallback } from 'react'
import { incidentService } from '../services/incidentService'
import { EmergencyCall } from '../types/police.types'

export function useIncidents(stationId?: string) {
  const [incidents, setIncidents] = useState<EmergencyCall[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await incidentService.getLiveIncidents(stationId)
      setIncidents(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch incidents')
    } finally {
      setLoading(false)
    }
  }, [stationId])

  useEffect(() => {
    fetchIncidents()

    // Subscribe to real-time updates
    const subscription = incidentService.subscribeToIncidents(stationId || '', (newIncident) => {
      setIncidents(prev => {
        const exists = prev.find(i => i.id === newIncident.id)
        if (exists) {
          return prev.map(i => i.id === newIncident.id ? newIncident : i)
        }
        return [newIncident, ...prev]
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [stationId, fetchIncidents])

  const updateStatus = async (incidentId: string, status: EmergencyCall['dispatch_status'], officerIds?: string[]) => {
    try {
      await incidentService.updateDispatchStatus(incidentId, status, officerIds)
      setIncidents(prev => prev.map(i => 
        i.id === incidentId ? { ...i, dispatch_status: status } : i
      ))
    } catch (err: any) {
      setError(err.message || 'Failed to update incident')
      throw err
    }
  }

  return {
    incidents,
    loading,
    error,
    refresh: fetchIncidents,
    updateStatus
  }
}
