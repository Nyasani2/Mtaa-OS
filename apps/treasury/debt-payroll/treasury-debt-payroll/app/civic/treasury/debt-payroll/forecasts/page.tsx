'use client'
import CashForecastChart from '@/domains/civic/treasury/components/CashForecastChart'
import { useCashForecasts } from '@/domains/civic/treasury/hooks/useCashForecasts'
import ForecastModelBadge from '@/domains/civic/treasury/components/ForecastModelBadge'
import VarianceIndicator from '@/domains/civic/treasury/components/VarianceIndicator'

export default function CashForecastsPage() {
  const { forecasts, loading } = useCashForecasts()

  if (loading) return <div className="h-48 bg-gray-100 rounded-lg animate-pulse"/>

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="space-y-6">
      <CashForecastChart/>
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Cash Forecasts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Period</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">Projected</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">Actual</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">Variance</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Model</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {forecasts.map(f => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{f.forecast_period}</td>
                  <td className="px-6 py-3 text-right text-gray-600">{fmt(f.projected_closing_balance)}</td>
                  <td className="px-6 py-3 text-right text-gray-600">{f.actual_closing_balance ? fmt(f.actual_closing_balance) : '—'}</td>
                  <td className="px-6 py-3 text-right"><VarianceIndicator variance={f.variance_percentage}/></td>
                  <td className="px-6 py-3"><ForecastModelBadge model={f.model_used}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
