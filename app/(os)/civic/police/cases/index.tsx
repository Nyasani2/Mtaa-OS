import React, { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useAuth } from '../../../shared/hooks/useAuth'
import { useCases } from '../../hooks/useCases'
import { CaseCard } from '../../components/CaseCard'
import { SearchBar } from '../../components/SearchBar'
import { StatusBadge } from '../../components/StatusBadge'
import { CaseFilter, CaseStatus, CaseType, CasePriority } from '../../types/police.types'
import { usePoliceStore } from '../../state/usePoliceStore'

const caseTypes: CaseType[] = [
  'theft', 'assault', 'homicide', 'robbery', 'burglary',
  'fraud', 'domestic_violence', 'sexual_assault', 'missing_person',
  'traffic_offense', 'drug_offense', 'terrorism', 'corruption',
  'public_order', 'property_damage', 'noise_complaint', 'civil_dispute',
  'child_protection', 'animal_cruelty', 'environmental', 'cybercrime'
]

const statuses: CaseStatus[] = [
  'reported', 'under_investigation', 'suspect_identified', 'suspect_arrested',
  'charges_filed', 'in_court', 'awaiting_trial', 'convicted', 'acquitted',
  'dismissed', 'closed', 'reopened', 'transferred', 'cold_case'
]

const priorities: CasePriority[] = ['critical', 'high', 'medium', 'low']

export default function CasesList() {
  const router = useRouter()
  const { user, isPolice } = useAuth()
  const [showFilters, setShowFilters] = useState(false)
  const { cases, loading, filter, setFilter, refresh } = useCases()
  const setSelectedCase = usePoliceStore((s) => s.setSelectedCase)

  if (!isPolice()) {
    router.push('/login')
    return null
  }

  const handleCaseClick = (caseItem: any) => {
    setSelectedCase(caseItem)
    router.push(`/police/cases/${caseItem.id}`)
  }

  const handleFilterChange = (key: keyof CaseFilter, value: any) => {
    setFilter({ ...filter, [key]: value || undefined })
  }

  const clearFilters = () => {
    setFilter({})
  }

  const activeFiltersCount = Object.values(filter).filter(v => v !== undefined && v !== '').length

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Cases | MTAA Police</title>
      </Head>

      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/police')} className="text-gray-500 hover:text-gray-900">
                ← Back
              </button>
              <h1 className="text-xl font-bold text-gray-900">Case Management</h1>
            </div>
            <button
              onClick={() => router.push('/police/cases/new')}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              + New Case
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search & Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <SearchBar 
                onSearch={(query) => handleFilterChange('search', query)} 
                placeholder="Search by case number, description, reporter..."
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-md text-sm transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-800"
              >
                Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filter.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  {statuses.map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Case Type</label>
                <select
                  value={filter.case_type || ''}
                  onChange={(e) => handleFilterChange('case_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  {caseTypes.map(t => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={filter.priority || ''}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Priorities</option>
                  {priorities.map(p => (
                    <option key={p} value={p}>{p.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              {loading ? 'Loading...' : `${cases.length} Cases`}
            </h2>
            <button
              onClick={refresh}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Refresh
            </button>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-12 text-gray-500">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                Loading cases...
              </div>
            ) : cases.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2">No cases found</p>
                <p className="text-sm">Try adjusting your filters or create a new case</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cases.map((caseItem) => (
                  <CaseCard 
                    key={caseItem.id} 
                    caseItem={caseItem} 
                    onClick={() => handleCaseClick(caseItem)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
