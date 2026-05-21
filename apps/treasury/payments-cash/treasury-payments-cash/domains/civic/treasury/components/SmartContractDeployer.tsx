'use client'
import { useState } from 'react'
import { useSmartContracts } from '../hooks/useSmartContracts'
import { FileCode, Rocket, Pause, Play, XCircle } from 'lucide-react'

const networks = ['ethereum', 'polygon', 'binance', 'solana', 'hyperledger'] as const
const types = ['payment', 'escrow', 'token', 'governance'] as const

export default function SmartContractDeployer() {
  const { contracts, loading, create, deploy, updateStatus } = useSmartContracts()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [network, setNetwork] = useState<typeof networks[number]>('ethereum')
  const [type, setType] = useState<typeof types[number]>('payment')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await create({ contract_name: name, contract_address: address, network, contract_type: type, status: 'draft' })
    setName(''); setAddress('')
    setSubmitting(false)
  }

  const statusActions = {
    draft: { icon: Rocket, action: 'Deploy', handler: deploy, next: 'deployed' },
    deployed: { icon: Play, action: 'Activate', handler: updateStatus, next: 'active' },
    active: { icon: Pause, action: 'Pause', handler: updateStatus, next: 'paused' },
    paused: { icon: Play, action: 'Resume', handler: updateStatus, next: 'active' }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2"><FileCode size={18}/> Register Smart Contract</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contract Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm" required/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contract Address</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm font-mono" placeholder="0x..." required/>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Network</label>
            <select value={network} onChange={e => setNetwork(e.target.value as typeof networks[number])}
              className="w-full rounded-lg border px-3 py-2 text-sm capitalize">
              {networks.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={type} onChange={e => setType(e.target.value as typeof types[number])}
              className="w-full rounded-lg border px-3 py-2 text-sm capitalize">
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" disabled={submitting}
          className="flex items-center gap-2 bg-treasury-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-treasury-700 disabled:opacity-50">
          <FileCode size={16}/> {submitting ? 'Registering...' : 'Register'}
        </button>
      </form>

      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Smart Contracts</h3>
        </div>
        <div className="divide-y">
          {contracts.map(c => {
            const action = statusActions[c.status as keyof typeof statusActions]
            return (
              <div key={c.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-gray-900">{c.contract_name}</p>
                  <p className="text-xs text-gray-500 font-mono">{c.contract_address.slice(0, 20)}... • {c.network}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    c.status === 'active' ? 'bg-green-50 text-green-700' :
                    c.status === 'deployed' ? 'bg-blue-50 text-blue-700' :
                    c.status === 'paused' ? 'bg-amber-50 text-amber-700' :
                    c.status === 'terminated' ? 'bg-red-50 text-red-700' :
                    'bg-gray-50 text-gray-600'
                  }`}>{c.status}</span>
                  {action && (
                    <button onClick={() => action.handler(c.id, 'current-user')}
                      className="text-xs bg-treasury-600 text-white px-3 py-1 rounded-full hover:bg-treasury-700 flex items-center gap-1">
                      <action.icon size={12}/> {action.action}
                    </button>
                  )}
                  {c.status !== 'terminated' && (
                    <button onClick={() => updateStatus(c.id, 'terminated')}
                      className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full hover:bg-red-100 flex items-center gap-1">
                      <XCircle size={12}/> Terminate
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
