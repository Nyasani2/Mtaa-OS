'use client'
import VoucherForm from '@/domains/civic/treasury/components/VoucherForm'
import PaymentProcessor from '@/domains/civic/treasury/components/PaymentProcessor'

export default function ExpendituresPage() {
  return (
    <div className="space-y-6">
      <VoucherForm/>
      <PaymentProcessor/>
    </div>
  )
}
