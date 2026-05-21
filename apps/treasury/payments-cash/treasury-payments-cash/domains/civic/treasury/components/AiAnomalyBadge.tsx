'use client'
import { AlertTriangle, Shield } from 'lucide-react'

export default function AiAnomalyBadge({ score }: { score?: number }) {
  if (score === undefined) return null
  const level = score > 0.8 ? 'critical' : score > 0.5 ? 'warning' : 'low'
  const config = {
    critical: { color: 'bg-red-100 text-red-700', icon: AlertTriangle, label: 'Critical Anomaly' },
    warning: { color: 'bg-amber-100 text-amber-700', icon: AlertTriangle, label: 'Suspicious' },
    low: { color: 'bg-green-100 text-green-700', icon: Shield, label: 'Normal' }
  }
  const cfg = config[level]
  const Icon = cfg.icon

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon size={12}/> {cfg.label} ({(score * 100).toFixed(0)}%)
    </span>
  )
}
