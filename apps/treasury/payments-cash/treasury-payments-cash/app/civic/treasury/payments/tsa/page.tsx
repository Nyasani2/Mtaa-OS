'use client'
import TsaAccountCard from '@/domains/civic/treasury/components/TsaAccountCard'
import TransactionLedger from '@/domains/civic/treasury/components/TransactionLedger'

export default function TsaPage() {
  return (
    <div className="space-y-6">
      <TsaAccountCard/>
      <TransactionLedger/>
    </div>
  )
}
