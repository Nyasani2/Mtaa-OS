import React, { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useAuth } from '../../../shared/hooks/useAuth'
import { caseService } from '../../services/caseService'
import { CaseType, CasePriority } from '../../types/police.types'

const caseTypes: { value: CaseType; label: string }[] = [
  { value: 'theft', label: 'Theft' },
  { value: 'assault', label: 'Assault' },
  { value: 'homicide', label: 'Homicide' },
  { value: 'robbery', label: 'Robbery' },
  { value: 'burglary', label: 'Burglary' },
  { value: 'fraud', label: 'Fraud' },
  { value: 'domestic_violence', label: 'Domestic Violence' },
  { value: 'sexual_assault', label: 'Sexual Assault' },
  { value: 'missing_person', label: 'Missing Person' },
  { value: 'traffic_offense', label: 'Traffic Offense' },
  { value: 'drug_offense', label: 'Drug Offense' },
  { value: 'terrorism', label: 'Terrorism' },
  { value: 'corruption', label: 'Corruption' },
  { value: 'public_order', label: 'Public Order' },
  { value: 'property_damage', label: 'Property Damage' },
  { value: 'noise_complaint', label: 'Noise Complaint' },
  { value: 'civil_dispute', label: 'Civil Dispute' },
  { value: 'child_protection', label: 'Child Protection' },
  { value: 'animal_cruelty', label: 'Animal Cruelty' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'cybercrime', label: 'Cybercrime' },
]

const priorities: { value: CasePriority; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const reporterTypes = [
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'phone', label: 'Phone' },
  { value: 'emergency_app', label: 'Emergency App' },
  { value: 'officer_patrol', label: 'Officer Patrol' },
  { value: 'anonymous', label: 'Anonymous' },
  { value: 'referral', label: 'Referral' },
]

export default function NewCase() {
  const router = useRouter()
  const { user, isPolice } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    case_type: '' as CaseType,
    priority: 'medium' as CasePriority,
    reporter_type: 'walk_in',
    reporter_name: '',
    reporter_phone: '',
    reporter_id_number: '',
    incident_location: '',
    incident_datetime: '',
    description: '',
    suspect_description: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!isPolice()) {
    router.push('/login')
    return null
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.case_type) newErrors.case_type = 'Case type is required'
    if (!formData.incident_location) newErrors.incident_location = 'Location is required'
    if (!formData.description) newErrors.description = 'Description is required'
    if (!formData.incident_datetime) newErrors.incident_datetime = 'Date/time is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      setSubmitting(true)
      const newCase = await caseService.createCase({
        ...formData,
        station_id: user?.station_id,
        country_id: user?.station_id ? undefined : 'ke', // fallback
        reporting_officer_id: user?.id,
        status: 'reported',
        evidence_photos: [],
        evidence_videos: [],
        evidence_documents: [],
        witness_statements: [],
        suspect_photos: [],
      })

      router.push(`/police/cases/${newCase.id}`)
    } catch (err: any) {
      alert('Failed to create case: ' + err.message)
      setSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => { const e = { ...prev }; delete e[field]; return e })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>New Case | MTAA Police</title>
      </Head>

      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900 mr-4">
              ← Cancel
            </button>
            <h1 className="text-xl font-bold text-gray-900">Report New Case</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Case Type & Priority */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Case Classification</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Case Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.case_type}
                  onChange={(e) => handleChange('case_type', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.case_type ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select case type</option>
                  {caseTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {errors.case_type && <p className="text-xs text-red-500 mt-1">{errors.case_type}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {priorities.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Reporter Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reporter Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reporter Type</label>
                <select
                  value={formData.reporter_type}
                  onChange={(e) => handleChange('reporter_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {reporterTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.reporter_name}
                    onChange={(e) => handleChange('reporter_name', e.target.value)}
                    placeholder="Reporter's full name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.reporter_phone}
                    onChange={(e) => handleChange('reporter_phone', e.target.value)}
                    placeholder="+254..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                <input
                  type="text"
                  value={formData.reporter_id_number}
                  onChange={(e) => handleChange('reporter_id_number', e.target.value)}
                  placeholder="National ID or Passport"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Incident Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Incident Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.incident_location}
                  onChange={(e) => handleChange('incident_location', e.target.value)}
                  placeholder="Street address, landmark, or coordinates"
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.incident_location ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.incident_location && <p className="text-xs text-red-500 mt-1">{errors.incident_location}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.incident_datetime}
                  onChange={(e) => handleChange('incident_datetime', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.incident_datetime ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.incident_datetime && <p className="text-xs text-red-500 mt-1">{errors.incident_datetime}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Detailed description of the incident..."
                  rows={5}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>
            </div>
          </div>

          {/* Suspect Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Suspect Information (Optional)</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.suspect_description}
                onChange={(e) => handleChange('suspect_description', e.target.value)}
                placeholder="Physical description, clothing, direction of travel..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Case'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
