'use client';

import { useState } from 'react';
import { CourtFine } from '@/types/courts';

export function FineForm({ onSubmit }: { onSubmit: (data: Partial<CourtFine>) => void }) {
  const [form, setForm] = useState<Partial<CourtFine>>({ fine_type: 'criminal_fine', payment_status: 'pending' });

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <input placeholder="Case ID" value={form.case_id || ''} onChange={e => setForm(f => ({ ...f, case_id: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <select value={form.fine_type} onChange={e => setForm(f => ({ ...f, fine_type: e.target.value as any }))} className="w-full border rounded px-3 py-2">
        <option value="court_fee">Court Fee</option>
        <option value="traffic_fine">Traffic Fine</option>
        <option value="criminal_fine">Criminal Fine</option>
        <option value="restitution">Restitution</option>
        <option value="contempt_fine">Contempt Fine</option>
      </select>
      <input type="number" placeholder="Amount (KES)" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) }))} className="w-full border rounded px-3 py-2" required />
      <input type="date" value={form.due_date || ''} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="w-full border rounded px-3 py-2" />
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Add Fine</button>
    </form>
  );
}
