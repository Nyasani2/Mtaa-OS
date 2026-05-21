'use client'
import { useAlerts } from '../hooks/useAlerts'
import { AlertTriangle, X, Info, AlertOctagon } from 'lucide-react'

const severityConfig = {
  critical: { icon: AlertOctagon, color: 'bg-red-50 border-red-200 text-red-800' },
  warning: { icon: AlertTriangle, color: 'bg-amber-50 border-amber-200 text-amber-800' },
  info: { icon: Info, color: 'bg-blue-50 border-blue-200 text-blue-800' }
}

export default function AlertPanel() {
  const { alerts, loading, dismiss } = useAlerts()

  if (loading) return <div className="h-48 bg-gray-100 rounded-lg animate-pulse"/>
  if (!alerts.length) return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
      <p className="text-green-700 font-medium">All systems operational</p>
      <p className="text-green-600 text-sm mt-1">No active alerts</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {alerts.map(alert => {
        const cfg = severityConfig[alert.severity]
        const Icon = cfg.icon
        return (
          <div key={alert.id} className={`flex items-start gap-3 p-4 rounded-lg border ${cfg.color}`}>
            <Icon size={18} className="mt-0.5 shrink-0"/>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{alert.message}</p>
              <p className="text-xs opacity-75 mt-1">{alert.module} • {new Date(alert.created_at).toLocaleString()}</p>
            </div>
            <button onClick={() => dismiss(alert.id)} className="shrink-0 hover:opacity-70"><X size={16}/></button>
          </div>
        )
      })}
    </div>
  )
}
