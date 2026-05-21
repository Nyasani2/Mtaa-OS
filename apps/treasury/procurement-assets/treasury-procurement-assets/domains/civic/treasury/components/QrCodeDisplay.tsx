'use client'
import { QrCode } from 'lucide-react'

export default function QrCodeDisplay({ hash }: { hash?: string }) {
  if (!hash) return <span className="text-xs text-gray-400">No QR code</span>

  return (
    <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
      <QrCode size={16} className="text-gray-600"/>
      <span className="text-xs font-mono text-gray-600">{hash.slice(0, 16)}...</span>
    </div>
  )
}
