'use client'
import { Brain, BarChart3, LineChart } from 'lucide-react'

export default function ForecastModelBadge({ model }: { model: string }) {
  const config: Record<string, { icon: typeof Brain; color: string; label: string }> = {
    'arima': { icon: LineChart, color: 'bg-blue-50 text-blue-700', label: 'ARIMA' },
    'prophet': { icon: Brain, color: 'bg-purple-50 text-purple-700', label: 'Prophet' },
    'linear': { icon: BarChart3, color: 'bg-gray-50 text-gray-700', label: 'Linear' },
    'ensemble': { icon: Brain, color: 'bg-amber-50 text-amber-700', label: 'Ensemble' }
  }
  const cfg = config[model.toLowerCase()] || { icon: BarChart3, color: 'bg-gray-50 text-gray-700', label: model }
  const Icon = cfg.icon

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon size={12}/> {cfg.label}
    </span>
  )
}
