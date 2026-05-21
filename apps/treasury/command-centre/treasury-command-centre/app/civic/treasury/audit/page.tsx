'use client'
import { useCommandStore } from '@/domains/civic/treasury/state/commandStore'
import { useEffect } from 'react'
import AuditLogTable from '@/domains/civic/treasury/components/AuditLogTable'

export default function AuditPage() {
  const { setActiveModule } = useCommandStore()
  useEffect(() => { setActiveModule('audit') }, [setActiveModule])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold text-gray-900">Audit & Compliance</h2>
        <p className="text-gray-500 mt-1">Review all system changes and compliance events.</p>
      </div>
      <AuditLogTable/>
    </div>
  )
}
