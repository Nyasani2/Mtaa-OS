'use client'
import { useCashForecasts } from '../hooks/useCashForecasts'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

export default function CashForecastChart() {
  const { forecasts, loading } = useCashForecasts()

  if (loading) return <div className="h-80 bg-gray-100 rounded-lg animate-pulse"/>

  const data = forecasts.slice(0, 12).map(f => ({
    period: f.forecast_period,
    projected: f.projected_closing_balance,
    actual: f.actual_closing_balance,
    variance: f.variance
  }))

  const fmt = (v: number) => `$${(v / 1000000).toFixed(1)}M`

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="font-semibold text-gray-900 mb-6">Cash Forecast vs Actual</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
          <XAxis dataKey="period" tick={{fontSize: 12}} stroke="#94a3b8"/>
          <YAxis tick={{fontSize: 12}} stroke="#94a3b8" tickFormatter={fmt}/>
          <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, '']}/>
          <ReferenceLine y={0} stroke="#cbd5e1"/>
          <Area type="monotone" dataKey="projected" stroke="#0ea5e9" fill="url(#colorProjected)" name="Projected"/>
          <Area type="monotone" dataKey="actual" stroke="#22c55e" fill="url(#colorActual)" name="Actual"/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
