import React, { useState, useEffect } from 'react'
import { caseService } from '../services/caseService'
import { CaseTimelineEvent } from '../types/police.types'

interface CaseTimelineProps {
  caseId: string
}

export function CaseTimeline({ caseId }: CaseTimelineProps) {
  const [events, setEvents] = useState<CaseTimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const data = await caseService.getCaseTimeline(caseId)
        setEvents(data)
      } catch (err) {
        console.error('Failed to fetch timeline:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTimeline()
  }, [caseId])

  if (loading) return <div className="text-center py-4 text-gray-500">Loading timeline...</div>
  if (events.length === 0) return <div className="text-center py-4 text-gray-500">No timeline events yet</div>

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            {index < events.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
          </div>
          <div className="pb-4 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm text-gray-900">{event.action.replace(/_/g, ' ').toUpperCase()}</span>
              <span className="text-xs text-gray-500">
                {new Date(event.created_at).toLocaleString('en-GB')}
              </span>
            </div>
            {event.description && (
              <p className="text-sm text-gray-600">{event.description}</p>
            )}
            {event.officer && (
              <p className="text-xs text-gray-500 mt-1">
                By: {event.officer.full_name || event.officer.badge_number} ({event.officer.rank})
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
