'use client'
import { Fingerprint, CheckCircle, XCircle } from 'lucide-react'

export default function BiometricVerifyBadge({ verified, onVerify }: { verified: boolean; onVerify?: () => void }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
        <CheckCircle size={12}/> Biometric Verified
      </span>
    )
  }
  return (
    <button onClick={onVerify}
      className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200">
      <Fingerprint size={12}/> Verify Biometric
    </button>
  )
}
