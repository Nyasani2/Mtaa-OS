'use client'
import { useCommandStore } from '@/domains/civic/treasury/state/commandStore'
import { useEffect } from 'react'

export default function ProcurementPage() {
  const { setActiveModule } = useCommandStore()
  useEffect(() => { setActiveModule('procurement') }, [setActiveModule])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Procurement & Assets</h2>
        <p className="text-gray-500 mt-2">Navigate to the Procurement module for full functionality.</p>
        <div className="mt-4 flex justify-center gap-4">
          <a href="/civic/treasury/procurement/requisitions" className="bg-treasury-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-treasury-700">Requisitions</a>
          <a href="/civic/treasury/procurement/tenders" className="bg-white border text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Tenders</a>
        </div>
      </div>
    </div>
  )
}
