'use client'
import { useEffect, useState } from 'react'
import { TreasuryDashboard } from '../types/command.types'
import { fetchDashboardMetrics } from '../services/dashboardService'

export function useDashboard() {
  const [data, setData] = useState<TreasuryDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchDashboardMetrics()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error, refresh: () => fetchDashboardMetrics().then(setData) }
}
