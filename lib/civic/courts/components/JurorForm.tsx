'use client';

import { useState } from 'react';
import { CourtJuror } from '@/types/courts';

export function JurorForm({ onSubmit }: { onSubmit: (data: Partial<CourtJuror>) => void }) {
  const [form, setForm] = useState<Partial<CourtJuror>>({ is_available: true });

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <input placeholder="Court House ID" value={form.court_house_id || ''} onChange={e => setForm(f => ({ ...f, court_house_id: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <input placeholder="Full Name" value={form.full_name || ''} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <input placeholder="ID Number" value={form.id_number || ''} onChange={e => setForm(f => ({ ...f, id_number: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <input placeholder="Phone" value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border rounded px-3 py-2" />
      <input placeholder="Occupation" value={form.occupation || ''} onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))} className="w-full border rounded px-3 py-2" />
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Add Juror</button>
    </form>
  );
}
