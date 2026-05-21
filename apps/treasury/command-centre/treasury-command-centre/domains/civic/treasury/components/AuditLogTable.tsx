'use client'
import { useAuditLogs } from '../hooks/useAuditLogs'
import { Shield } from 'lucide-react'

export default function AuditLogTable({ tableName }: { tableName?: string }) {
  const { logs, loading } = useAuditLogs(tableName)

  if (loading) return <div className="h-64 bg-gray-100 rounded-lg animate-pulse"/>

  return (
    <div className="bg-white rounded-lg border">
      <div className="px-6 py-4 border-b flex items-center gap-2">
        <Shield size={18} className="text-treasury-600"/>
        <h3 className="font-semibold text-gray-900">Audit Trail</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Action</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Table</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Record</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    log.action === 'INSERT' ? 'bg-green-50 text-green-700' :
                    log.action === 'UPDATE' ? 'bg-blue-50 text-blue-700' :
                    'bg-red-50 text-red-700'
                  }`}>{log.action}</span>
                </td>
                <td className="px-6 py-3 text-gray-600">{log.table_name}</td>
                <td className="px-6 py-3 text-gray-600 font-mono text-xs">{log.record_id.slice(0, 8)}...</td>
                <td className="px-6 py-3 text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
