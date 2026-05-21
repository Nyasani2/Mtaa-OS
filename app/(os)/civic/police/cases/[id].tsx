import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useAuth } from '../../../shared/hooks/useAuth'
import { caseService } from '../../services/caseService'
import { PoliceCase, CaseStatus } from '../../types/police.types'
import { StatusBadge } from '../../components/StatusBadge'
import { CaseTimeline } from '../../components/CaseTimeline'
import { EvidenceUploader } from '../../components/EvidenceUploader'
import { OfficerSelector } from '../../components/OfficerSelector'
import { usePoliceStore } from '../../state/usePoliceStore'

const statusFlow: CaseStatus[] = [
  'reported',
  'under_investigation',
  'suspect_identified',
  'suspect_arrested',
  'charges_filed',
  'in_court',
  'awaiting_trial',
  'convicted',
  'acquitted',
  'dismissed',
  'closed',
]

const forwardOptions = [
  { value: 'prosecutor', label: 'Prosecutor' },
  { value: 'court', label: 'Court' },
  { value: 'higher_station', label: 'Higher Station' },
  { value: 'special_unit', label: 'Special Unit' },
  { value: 'interpol', label: 'Interpol' },
]

export default function CaseDetail() {
  const router = useRouter()
  const { id } = router.query
  const { user, isPolice } = useAuth()
  const [caseItem, setCaseItem] = useState<PoliceCase | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'evidence' | 'actions'>('details')
  const [statusNotes, setStatusNotes] = useState('')
  const [forwardTo, setForwardTo] = useState('')
  const [forwardNotes, setForwardNotes] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const selectedCase = usePoliceStore((s) => s.selectedCase)

  useEffect(() => {
    if (!id) return
    loadCase()
  }, [id])

  const loadCase = async () => {
    try {
      setLoading(true)
      const data = await caseService.getCaseById(id as string)
      setCaseItem(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load case')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: CaseStatus) => {
    if (!caseItem) return
    try {
      setUpdating(true)
      await caseService.updateCaseStatus(caseItem.id, newStatus, statusNotes)
      setCaseItem({ ...caseItem, status: newStatus })
      setStatusNotes('')
    } catch (err: any) {
      alert('Failed to update status: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleAssign = async (officerId: string) => {
    if (!caseItem) return
    try {
      setUpdating(true)
      await caseService.assignOfficer(caseItem.id, officerId)
      setCaseItem({ ...caseItem, assigned_officer_id: officerId, status: 'under_investigation' })
      setShowAssignModal(false)
    } catch (err: any) {
      alert('Failed to assign officer: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleForward = async () => {
    if (!caseItem || !forwardTo) return
    try {
      setUpdating(true)
      await caseService.forwardCase(caseItem.id, forwardTo, forwardNotes)
      setCaseItem({ ...caseItem, forwarded_to: forwardTo, status: 'transferred' })
      setForwardTo('')
      setForwardNotes('')
    } catch (err: any) {
      alert('Failed to forward case: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  const getStatusIndex = (status: CaseStatus) => statusFlow.indexOf(status)
  const currentStatusIndex = caseItem ? getStatusIndex(caseItem.status) : -1

  if (!isPolice()) {
    router.push('/login')
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading case...</p>
        </div>
      </div>
    )
  }

  if (error || !caseItem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Case not found'}</p>
          <button
            onClick={() => router.push('/police/cases')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Cases
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Case {caseItem.case_number} | MTAA Police</title>
      </Head>

      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/police/cases')} className="text-gray-500 hover:text-gray-900">
                ← Back
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{caseItem.case_number}</h1>
                <p className="text-xs text-gray-500">{caseItem.case_type.replace(/_/g, ' ').toUpperCase()}</p>
              </div>
            </div>
            <StatusBadge status={caseItem.status} />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Tracker */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Case Status Tracker</h2>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {statusFlow.map((status, index) => {
              const isActive = index <= currentStatusIndex
              const isCurrent = index === currentStatusIndex

              return (
                <React.Fragment key={status}>
                  <div className="flex flex-col items-center min-w-[80px]">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                      isActive ? 'bg-green-500 text-white' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      {isActive ? '✓' : index + 1}
                    </div>
                    <span className={`text-xs mt-1 text-center ${isCurrent ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>
                      {status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {index < statusFlow.length - 1 && (
                    <div className={`flex-1 h-0.5 min-w-[20px] ${
                      index < currentStatusIndex ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            {(['details', 'timeline', 'evidence', 'actions'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Reporter</h3>
                    <p className="text-gray-900">{caseItem.reporter_name || 'Anonymous'}</p>
                    {caseItem.reporter_phone && <p className="text-sm text-gray-600">{caseItem.reporter_phone}</p>}
                    {caseItem.reporter_id_number && <p className="text-sm text-gray-600">ID: {caseItem.reporter_id_number}</p>}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Incident Location</h3>
                    <p className="text-gray-900">{caseItem.incident_location}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(caseItem.incident_datetime).toLocaleString('en-GB')}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{caseItem.description}</p>
                </div>

                {caseItem.suspect_description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Suspect Description</h3>
                    <p className="text-gray-900">{caseItem.suspect_description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Reporting Officer</h3>
                    <p className="text-gray-900">
                      {caseItem.reporting_officer?.full_name || caseItem.reporting_officer?.badge_number || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600">{caseItem.reporting_officer?.rank}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Assigned Officer</h3>
                    {caseItem.assigned_officer ? (
                      <>
                        <p className="text-gray-900">{caseItem.assigned_officer.full_name || caseItem.assigned_officer.badge_number}</p>
                        <p className="text-sm text-gray-600">{caseItem.assigned_officer.rank}</p>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Not assigned</span>
                        <button
                          onClick={() => setShowAssignModal(true)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Assign
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {caseItem.forwarded_to && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <h3 className="text-sm font-medium text-yellow-800 mb-1">Forwarded To</h3>
                    <p className="text-yellow-900">{caseItem.forwarded_to.replace(/_/g, ' ').toUpperCase()}</p>
                    {caseItem.forwarded_at && (
                      <p className="text-xs text-yellow-700">
                        On {new Date(caseItem.forwarded_at).toLocaleString('en-GB')}
                      </p>
                    )}
                    {caseItem.forwarding_notes && (
                      <p className="text-sm text-yellow-800 mt-2">{caseItem.forwarding_notes}</p>
                    )}
                  </div>
                )}

                {caseItem.resolved_at && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <h3 className="text-sm font-medium text-green-800 mb-1">Resolution</h3>
                    <p className="text-xs text-green-700">
                      Resolved on {new Date(caseItem.resolved_at).toLocaleString('en-GB')}
                    </p>
                    {caseItem.resolution_notes && (
                      <p className="text-sm text-green-800 mt-2">{caseItem.resolution_notes}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && <CaseTimeline caseId={caseItem.id} />}

            {/* Evidence Tab */}
            {activeTab === 'evidence' && <EvidenceUploader caseId={caseItem.id} />}

            {/* Actions Tab */}
            {activeTab === 'actions' && (
              <div className="space-y-6">
                {/* Status Update */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Update Status</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Notes (optional)</label>
                      <textarea
                        value={statusNotes}
                        onChange={(e) => setStatusNotes(e.target.value)}
                        placeholder="Reason for status change..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {statusFlow.map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(status)}
                          disabled={updating || caseItem.status === status}
                          className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                            caseItem.status === status
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                          }`}
                        >
                          {status.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Assign Officer */}
                {!caseItem.assigned_officer_id && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Assign Officer</h3>
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Select Officer
                    </button>
                  </div>
                )}

                {/* Forward Case */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Forward Case</h3>
                  <div className="space-y-3">
                    <select
                      value={forwardTo}
                      onChange={(e) => setForwardTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select destination</option>
                      {forwardOptions.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <textarea
                      value={forwardNotes}
                      onChange={(e) => setForwardNotes(e.target.value)}
                      placeholder="Forwarding notes..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleForward}
                      disabled={!forwardTo || updating}
                      className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                    >
                      Forward Case
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Assign Officer Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Assign Officer</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <OfficerSelector
                stationId={caseItem.station_id}
                onSelect={(officer) => handleAssign(officer.id)}
                filterStatus={['on_duty', 'on_patrol']}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
