'use client'
import DebtInstrumentCard from '@/domains/civic/treasury/components/DebtInstrumentCard'
import DebtServiceCalendar from '@/domains/civic/treasury/components/DebtServiceCalendar'
import MaturityAlert from '@/domains/civic/treasury/components/MaturityAlert'

export default function DebtPage() {
  return (
    <div className="space-y-6">
      <MaturityAlert/>
      <DebtInstrumentCard/>
      <DebtServiceCalendar/>
    </div>
  )
}
