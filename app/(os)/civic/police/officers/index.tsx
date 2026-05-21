import React, { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useAuth } from '../../../shared/hooks/useAuth'
import { useOfficers } from '../../hooks/useOfficers'
import { officerService } from '../../services/officerService'
import { PoliceOfficer, DutyStatus } from '../../types/police.types'

const dutyStatuses: { value: DutyStatus; label: string; color: string }[] = [
  { value: 'off_duty', label: 'Off Duty', color: 'bg-gray-100 text-gray-800' },
  { value: 'on_duty', label: 'On Duty', color: 'bg-green-100 text-green-800' },
  { value: 'on_patrol', label: 'On Patrol', color: 'bg-blue-100 text-blue-800' },
  { value: 'on_leave', label: 'On Leave', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'suspended', label: 'Suspended', color: 'bg-red-100 text-red-800' },
]

export default function OfficersPage() {
  const router = useRouter()
  const { user, isPolice } = useAuth()
  const { officers, loading, refresh, updateDutyStatus } = useOfficers(user?.station_id)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedOfficer, setSelectedOfficer] = useState<PoliceOfficer | null>(null)

  if (!isPolice()) {
    router.push('/login')
    return null
  }

  const filteredOfficers = officers.filter(o => {
    const matchesSearch = !searchQuery || 
      o.badge_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.rank.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.department.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = !statusFilter || o.duty_status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleStatusChange = async (officerId: string, newStatus: DutyStatus) => {
    try {
      await updateDutyStatus(officerId, newStatus)
    } catch (err: any) {
      alert('Failed to update status: ' + err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Officers | MTAA Police</title>
      </Head>

      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/police')} className="text-gray-500 hover:text-gray-900">
                ← Back
              </button>
              <h1 className="text-xl font-bold text-gray-900">Officer Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{filteredOfficers.length} officers</span>
              <button
                onClick={refresh}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by badge, name, rank, department..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              {dutyStatuses.map((status) => (
                <button
                  key={status.value}
                  onClick={() => setStatusFilter(statusFilter === status.value ? '' : status.value)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    statusFilter === status.value
                      ? status.color + ' ring-2 ring-offset-1'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Officers Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">Loading officers...</p>
          </div>
        ) : filteredOfficers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-lg text-gray-500 mb-2">No officers found</p>
            <p className="text-sm text-gray-400">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOfficers.map((officer) => (
              <div
                key={officer.id}
                onClick={() => setSelectedOfficer(officer)}
                className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedOfficer?.id === officer.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-700 flex-shrink-0">
                    {officer.full_name?.charAt(0) || officer.badge_number.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {officer.full_name || officer.badge_number}
                    </h3>
                    <p className="text-sm text-gray-500">{officer.badge_number}</p>
                    <p className="text-xs text-gray-400 capitalize">
                      {officer.rank.replace(/_/g, ' ')} • {officer.department.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    dutyStatuses.find(s => s.value === officer.duty_status)?.color || 'bg-gray-100'
                  }`}>
                    {officer.duty_status.replace(/_/g, ' ')}
                  </span>
                </div>

                {officer.radio_call_sign && (
                  <p className="mt-2 text-xs text-gray-500">Call Sign: {officer.radio_call_sign}</p>
                )}

                {/* Quick Status Actions */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                  {(['on_duty', 'on_patrol', 'off_duty', 'on_leave'] as DutyStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStatusChange(officer.id, status)
                      }}
                      disabled={officer.duty_status === status}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        officer.duty_status === status
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {status.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Officer Detail Modal */}
      {selectedOfficer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Officer Details</h3>
              <button onClick={() => setSelectedOfficer(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-700">
                  {selectedOfficer.full_name?.charAt(0) || selectedOfficer.badge_number.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {selectedOfficer.full_name || selectedOfficer.badge_number}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedOfficer.badge_number}</p>
                  <p className="text-sm text-gray-500 capitalize">
                    {selectedOfficer.rank.replace(/_/g, ' ')} • {selectedOfficer.department.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Duty Status</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    dutyStatuses.find(s => s.value === selectedOfficer.duty_status)?.color
                  }`}>
                    {selectedOfficer.duty_status.replace(/_/g, ' ')}
                  </span>
                </div>
                {selectedOfficer.phone && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Phone</span>
                    <span className="text-sm text-gray-900">{selectedOfficer.phone}</span>
                  </div>
                )}
                {selectedOfficer.email && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Email</span>
                    <span className="text-sm text-gray-900">{selectedOfficer.email}</span>
                  </div>
                )}
                {selectedOfficer.radio_call_sign && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Call Sign</span>
                    <span className="text-sm text-gray-900 font-mono">{selectedOfficer.radio_call_sign}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    router.push(`/police/cases?assigned=${selectedOfficer.id}`)
                    setSelectedOfficer(null)
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  View Cases
                </button>
                <button
                  onClick={() => setSelectedOfficer(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
