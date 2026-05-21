'use client'
import { useEffect, useState } from 'react'
import { RevenueForecast } from '../types/debtPayroll.types'
import { fetchRevenueForecasts, createRevenueForecast, recordActualRevenue } from '../services/revenueForecastService'

export function useRevenueForecasts() {
  const [forecasts, setForecasts] = useState<RevenueForecast[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchRevenueForecasts().then(setForecasts).finally(() => setLoading(false)) }, [])

  const create = async (forecast: Omit<RevenueForecast, 'id' | 'variance' | 'created_at'>) => {
    const created = await createRevenueForecast(forecast)
    setForecasts(prev => [created, ...prev])
    return created
  }

  const recordActual = async (id: string, actual: number) => {
    await recordActualRevenue(id, actual)
    setForecasts(prev => prev.map(f => f.id === id ? { ...f, actual_revenue: actual } : f))
  }

  return { forecasts, loading, create, recordActual }
}
