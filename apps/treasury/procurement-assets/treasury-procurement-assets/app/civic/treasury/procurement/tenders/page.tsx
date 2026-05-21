'use client'
import TenderBoard from '@/domains/civic/treasury/components/TenderBoard'
import BidCounter from '@/domains/civic/treasury/components/BidCounter'

export default function TendersPage() {
  return (
    <div className="space-y-6">
      <BidCounter/>
      <TenderBoard/>
    </div>
  )
}
