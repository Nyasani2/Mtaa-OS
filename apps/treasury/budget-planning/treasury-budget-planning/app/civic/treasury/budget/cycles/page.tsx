'use client'
import CycleForm from '@/domains/civic/treasury/components/CycleForm'
import CycleList from '@/domains/civic/treasury/components/CycleList'

export default function CyclesPage() {
  return (
    <div className="space-y-6">
      <CycleForm/>
      <CycleList/>
    </div>
  )
}
