'use client'
import { CheckCircle, AlertTriangle, XCircle, Minus, Trash2 } from 'lucide-react'

export default function ConditionBadge({ condition }: { condition: string }) {
  const config: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
    new: { icon: CheckCircle, color: 'bg-green-50 text-green-700', label: 'New' },
    good: { icon: CheckCircle, color: 'bg-blue-50 text-blue-700', label: 'Good' },
    fair: { icon: AlertTriangle, color: 'bg-amber-50 text-amber-700', label: 'Fair' },
    poor: { icon: XCircle, color: 'bg-red-50 text-red-700', label: 'Poor' },
    disposed: { icon: Trash2, color: 'bg-gray-100 text-gray-500', label: 'Disposed' }
  }
  const cfg = config[condition] || config.good
  const Icon = cfg.icon

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon size={12}/> {cfg.label}
    </span>
  )
}
