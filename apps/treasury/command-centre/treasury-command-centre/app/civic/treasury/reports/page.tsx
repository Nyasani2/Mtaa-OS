'use client'
import { useCommandStore } from '@/domains/civic/treasury/state/commandStore'
import { useEffect } from 'react'

export default function ReportsPage() {
  const { setActiveModule } = useCommandStore()
  useEffect(() => { setActiveModule('reports') }, [setActiveModule])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Reports & Analytics</h2>
        <p className="text-gray-500 mt-2">Generate and export treasury reports.</p>
        <div className="mt-4 flex justify-center gap-4">
          <button className="bg-treasury-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-treasury-700">Cash Position</button>
          <button className="bg-white border text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Budget Execution</button>
          <button className="bg-white border text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Debt Portfolio</button>
        </div>
      </div>
    </div>
  )
}
