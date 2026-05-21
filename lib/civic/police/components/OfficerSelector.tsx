import React, { useState } from 'react'
import { useOfficers } from '../hooks/useOfficers'
import { PoliceOfficer } from '../types/police.types'

interface OfficerSelectorProps {
  stationId: string
  selectedOfficerId?: string
  onSelect: (officer: PoliceOfficer) => void
  filterStatus?: string[]
}

export function OfficerSelector({ stationId, selectedOfficerId, onSelect, filterStatus }: OfficerSelectorProps) {
  const { officers, loading } = useOfficers(stationId)
  const [search, setSearch] = useState('')

  const filteredOfficers = officers.filter(o => {
    const matchesSearch = !search || 
      o.badge_number.toLowerCase().includes(search.toLowerCase()) ||
      o.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.rank.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = !filterStatus || filterStatus.includes(o.duty_status)

    return matchesSearch && matchesStatus
  })

  if (loading) return <div className="text-sm text-gray-500">Loading officers...</div>

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Search officers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="max-h-60 overflow-y-auto space-y-1">
        {filteredOfficers.map((officer) => (
          <button
            key={officer.id}
            onClick={() => onSelect(officer)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              selectedOfficerId === officer.id
                ? 'bg-blue-50 border-blue-200 border'
                : 'hover:bg-gray-50 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                {officer.full_name?.charAt(0) || 'O'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {officer.full_name || officer.badge_number}
                </p>
                <p className="text-xs text-gray-500">
                  {officer.rank.replace(/_/g, ' ')} • {officer.duty_status.replace(/_/g, ' ')}
                </p>
              </div>
              {selectedOfficerId === officer.id && (
                <span className="text-blue-600 text-lg">✓</span>
              )}
            </div>
          </button>
        ))}

        {filteredOfficers.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No officers found</p>
        )}
      </div>
    </div>
  )
}
