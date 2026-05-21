'use client'
import { useEffect, useState } from 'react'
import { TreasuryAlert } from '../types/command.types'
import { fetchAlerts, dismissAlert } from '../services/dashboardService'

export function useAlerts() {
  const [alerts, setAlerts] = useState<TreasuryAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlerts().then(setAlerts).finally(() => setLoading(false))
  }, [])

  const dismiss = async (id: string) => {
    await dismissAlert(id)
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  return { alerts, loading, dismiss }
}
