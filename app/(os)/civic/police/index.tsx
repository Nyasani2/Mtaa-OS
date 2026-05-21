import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useAuth } from '../../shared/hooks/useAuth'
import { useCases } from '../hooks/useCases'
import { useIncidents } from '../hooks/useIncidents'
import { caseService } from '../services/caseService'
import { DashboardStats } from '../components/DashboardStats'
import { IncidentFeed } from '../components/IncidentFeed'
import { CaseCard } from '../components/CaseCard'
import { NotificationBell } from '../components/NotificationBell'
import { SearchBar } from '../components/SearchBar'
import { StatusBadge } from '../components/StatusBadge'
import { usePoliceStore } from '../state/usePoliceStore'

export default function PoliceDashboard() {
  const router = useRouter()
  const { user, isPolice } = useAuth()
  const { cases, loading: casesLoading, filter, setFilter } = useCases({ status: 'reported' })
  const { incidents, loading: incidentsLoading, updateStatus } = useIncidents(user?.station_id)
  const [stats, setStats] = useState({ total: 0, open: 0, investigating: 0, closed: 0, critical: 0 })
  const setSelectedCase = usePoliceStore((s) => s.setSelectedCase)

  useEffect(() => {
    if (!isPolice()) {
      router.push('/login')
      return
    }
    loadStats()
  }, [isPolice, router])

  const loadStats = async () => {
    try {
      const data = await caseService.getCaseStats(user?.station_id)
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  const handleCaseClick = (caseItem: any) => {
    setSelectedCase(caseItem)
    router.push(`/police/cases/${caseItem.id}`)
  }

  const handleSearch = (query: string) => {
    setFilter({ ...filter, search: query })
  }

  if (!isPolice()) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Police Dashboard | MTAA Civic</title>
      </Head>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">🚔 Police Command</h1>
              <span className="text-sm text-gray-500">{user?.station_id || 'Station'}</span>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell userId={user?.id || ''} />
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                {user?.email?.charAt(0).toUpperCase() || 'P'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <DashboardStats stats={stats} />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Incidents */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">🔴 Live Incidents</h2>
                <span className="text-xs text-gray-500">Real-time</span>
              </div>
              <div className="p-4">
                {incidentsLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading incidents...</div>
                ) : (
                  <IncidentFeed incidents={incidents} onStatusUpdate={updateStatus} />
                )}
              </div>
            </div>
          </div>

          {/* Recent Cases */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-900">📋 Recent Cases</h2>
                  <button
                    onClick={() => router.push('/police/cases/new')}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    + New Case
                  </button>
                </div>
                <SearchBar onSearch={handleSearch} placeholder="Search cases..." />
              </div>
              <div className="p-4">
                {casesLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading cases...</div>
                ) : cases.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No cases found</div>
                ) : (
                  <div className="space-y-3">
                    {cases.slice(0, 10).map((caseItem) => (
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
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/police/cases/new')}
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-left"
          >
            <span className="text-2xl mb-2 block">📝</span>
            <span className="font-medium text-gray-900">Report Case</span>
          </button>
          <button
            onClick={() => router.push('/police/officers')}
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-left"
          >
            <span className="text-2xl mb-2 block">👮</span>
            <span className="font-medium text-gray-900">Officers</span>
          </button>
          <button
            onClick={() => router.push('/police/cases')}
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-left"
          >
            <span className="text-2xl mb-2 block">📁</span>
            <span className="font-medium text-gray-900">All Cases</span>
          </button>
          <button
            onClick={() => router.push('/police/cases?filter=critical')}
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-left"
          >
            <span className="text-2xl mb-2 block">🚨</span>
            <span className="font-medium text-gray-900">Critical</span>
          </button>
        </div>
      </main>
    </div>
  )
}
