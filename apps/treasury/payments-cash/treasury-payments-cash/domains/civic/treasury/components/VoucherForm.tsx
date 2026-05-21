'use client'
import { useState } from 'react'
import { useExpenditures } from '../hooks/useExpenditures'
import { FileText, Save } from 'lucide-react'

export default function VoucherForm({ onSuccess }: { onSuccess?: () => void }) {
  const { create } = useExpenditures()
  const [voucherNumber, setVoucherNumber] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [payeeName, setPayeeName] = useState('')
  const [payeeAccount, setPayeeAccount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<TreasuryExpenditure['payment_method']>('bank_transfer')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await create({
      voucher_number: voucherNumber,
      description,
      amount: parseFloat(amount),
      payee_name: payeeName,
      payee_account: payeeAccount || undefined,
      status: 'pending',
      payment_method: paymentMethod,
      created_by: 'current-user'
    })
    setSubmitting(false)
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2"><FileText size={18}/> New Expenditure Voucher</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Voucher Number</label>
          <input type="text" value={voucherNumber} onChange={e => setVoucherNumber(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="VCH-2025-001" required/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="0.00" required/>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input type="text" value={description} onChange={e => setDescription(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Payment for..." required/>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payee Name</label>
          <input type="text" value={payeeName} onChange={e => setPayeeName(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm" required/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payee Account (optional)</label>
          <input type="text" value={payeeAccount} onChange={e => setPayeeAccount(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Bank account / wallet"/>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
        <div className="flex gap-2">
          {(['bank_transfer', 'cheque', 'cash', 'mobile_money', 'crypto'] as const).map(m => (
            <button key={m} type="button" onClick={() => setPaymentMethod(m)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                paymentMethod === m ? 'bg-treasury-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{m.replace('_', ' ')}</button>
          ))}
        </div>
      </div>
      <button type="submit" disabled={submitting}
        className="flex items-center gap-2 bg-treasury-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-treasury-700 disabled:opacity-50">
        <Save size={16}/> {submitting ? 'Creating...' : 'Create Voucher'}
      </button>
    </form>
  )
}
