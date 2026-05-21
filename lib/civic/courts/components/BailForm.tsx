'use client';

import { useState } from 'react';
import { CourtBail } from '@/types/courts';

export function BailForm({ onSubmit }: { onSubmit: (data: Partial<CourtBail>) => void }) {
  const [form, setForm] = useState<Partial<CourtBail>>({ bail_type: 'cash_bail', status: 'pending' });

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <input placeholder="Case ID" value={form.case_id || ''} onChange={e => setForm(f => ({ ...f, case_id: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <input placeholder="Party ID" value={form.party_id || ''} onChange={e => setForm(f => ({ ...f, party_id: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <select value={form.bail_type} onChange={e => setForm(f => ({ ...f, bail_type: e.target.value as any }))} className="w-full border rounded px-3 py-2">
        <option value="cash_bail">Cash Bail</option>
        <option value="surety_bond">Surety Bond</option>
        <option value="property_bond">Property Bond</option>
        <option value="personal_recognizance">Personal Recognizance</option>
      </select>
      <input type="number" placeholder="Amount (KES)" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) }))} className="w-full border rounded px-3 py-2" required />
      <input placeholder="Conditions (comma separated)" onChange={e => setForm(f => ({ ...f, conditions: e.target.value.split(',').map(s => s.trim()) }))} className="w-full border rounded px-3 py-2" />
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Create Bail</button>
    </form>
  );
}
