'use client'
import { Zap, AlertTriangle, Clock, CheckCircle } from 'lucide-react'

export default function UrgencyBadge({ urgency }: { urgency: string }) {
  const config: Record<string, { icon: typeof Zap; color: string; label: string }> = {
    critical: { icon: Zap, color: 'bg-red-100 text-red-700', label: 'Critical' },
    high: { icon: AlertTriangle, color: 'bg-amber-100 text-amber-700', label: 'High' },
    medium: { icon: Clock, color: 'bg-blue-100 text-blue-700', label: 'Medium' },
    low: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Low' }
  }
  const cfg = config[urgency] || config.low
  const Icon = cfg.icon

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon size={12}/> {cfg.label}
    </span>
  )
}
