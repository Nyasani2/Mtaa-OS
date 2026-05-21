'use client'
import { useEffect, useState } from 'react'
import { CashForecast } from '../types/debtPayroll.types'
import { fetchCashForecasts, createCashForecast, recordActualClosing } from '../services/cashForecastService'

export function useCashForecasts() {
  const [forecasts, setForecasts] = useState<CashForecast[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchCashForecasts().then(setForecasts).finally(() => setLoading(false)) }, [])

  const create = async (forecast: Omit<CashForecast, 'id' | 'variance' | 'variance_percentage' | 'created_at'>) => {
    const created = await createCashForecast(forecast)
    setForecasts(prev => [created, ...prev])
    return created
  }

  const recordActual = async (id: string, actual: number) => {
    await recordActualClosing(id, actual)
    setForecasts(prev => prev.map(f => f.id === id ? { ...f, actual_closing_balance: actual } : f))
  }

  return { forecasts, loading, create, recordActual }
}
