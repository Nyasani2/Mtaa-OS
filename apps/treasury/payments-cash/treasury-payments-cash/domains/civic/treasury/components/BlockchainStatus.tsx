'use client'
import { useSmartContracts } from '../hooks/useSmartContracts'
import { Link, Shield, AlertCircle } from 'lucide-react'

export default function BlockchainStatus() {
  const { contracts, loading } = useSmartContracts()

  if (loading) return <div className="h-24 bg-gray-100 rounded-lg animate-pulse"/>

  const active = contracts.filter(c => c.status === 'active').length
  const total = contracts.length

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600"><Link size={18}/></div>
          <div>
            <p className="font-semibold text-gray-900">Blockchain Integration</p>
            <p className="text-sm text-gray-500">{active} of {total} contracts active</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {active > 0 ? (
            <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full">
              <Shield size={12}/> Connected
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs bg-gray-50 text-gray-600 px-3 py-1 rounded-full">
              <AlertCircle size={12}/> No active contracts
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
