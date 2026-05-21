'use client'
import KpiCards from '@/domains/civic/treasury/components/KpiCards'
import AlertPanel from '@/domains/civic/treasury/components/AlertPanel'
import TransactionFeed from '@/domains/civic/treasury/components/TransactionFeed'
import CashFlowChart from '@/domains/civic/treasury/components/CashFlowChart'

export default function TreasuryDashboardPage() {
  return (
    <div className="space-y-6">
      <KpiCards/>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2"><CashFlowChart/></div>
        <div><AlertPanel/></div>
      </div>
      <TransactionFeed/>
    </div>
  )
}
