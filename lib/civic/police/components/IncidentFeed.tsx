import React from 'react'
import { EmergencyCall } from '../types/police.types'
import { StatusBadge } from './StatusBadge'

interface IncidentFeedProps {
  incidents: EmergencyCall[]
  onStatusUpdate: (incidentId: string, status: EmergencyCall['dispatch_status']) => void
}

export function IncidentFeed({ incidents, onStatusUpdate }: IncidentFeedProps) {
  if (incidents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No active incidents</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {incidents.map((incident) => (
        <div key={incident.id} className="bg-white rounded-lg border border-red-200 p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-semibold text-gray-900">{incident.emergency_type.replace(/_/g, ' ').toUpperCase()}</h4>
              <p className="text-sm text-gray-500">{incident.call_uuid}</p>
            </div>
            <StatusBadge status={incident.priority} size="sm" />
          </div>

          <p className="text-gray-700 text-sm mb-3">{incident.description}</p>

          <div className="flex items-center justify-between">
            <StatusBadge status={incident.dispatch_status} size="sm" />

            <div className="flex gap-2">
              {incident.dispatch_status === 'received' && (
                <button
                  onClick={() => onStatusUpdate(incident.id, 'dispatched')}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                >
                  Dispatch
                </button>
              )}
              {incident.dispatch_status === 'dispatched' && (
                <button
                  onClick={() => onStatusUpdate(incident.id, 'en_route')}
                  className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                >
                  En Route
                </button>
              )}
              {incident.dispatch_status === 'en_route' && (
                <button
                  onClick={() => onStatusUpdate(incident.id, 'on_scene')}
                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                >
                  On Scene
                </button>
              )}
              {(incident.dispatch_status === 'on_scene' || incident.dispatch_status === 'en_route') && (
                <button
                  onClick={() => onStatusUpdate(incident.id, 'resolved')}
                  className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                >
                  Resolve
                </button>
              )}
            </div>
          </div>

          {incident.caller_phone && (
            <div className="mt-2 text-xs text-gray-500">
              Caller: {incident.caller_name || 'Unknown'} — {incident.caller_phone}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
