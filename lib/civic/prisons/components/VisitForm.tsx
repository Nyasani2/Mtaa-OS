'use client';

import { useState } from 'react';
import { PrisonVisit } from '@/types/prisons';

export function VisitForm({ onSubmit }: { onSubmit: (data: Partial<PrisonVisit>) => void }) {
  const [form, setForm] = useState<Partial<PrisonVisit>>({ status: 'scheduled', visit_type: 'standard', duration_minutes: 30 });

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <input placeholder="Inmate ID" value={form.inmate_id || ''} onChange={e => setForm(f => ({ ...f, inmate_id: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <input placeholder="Visitor Name" value={form.visitor_name || ''} onChange={e => setForm(f => ({ ...f, visitor_name: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <input placeholder="Visitor ID Number" value={form.visitor_id_number || ''} onChange={e => setForm(f => ({ ...f, visitor_id_number: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <input placeholder="Relationship" value={form.visitor_relationship || ''} onChange={e => setForm(f => ({ ...f, visitor_relationship: e.target.value }))} className="w-full border rounded px-3 py-2" />
      <select value={form.visit_type} onChange={e => setForm(f => ({ ...f, visit_type: e.target.value as any }))} className="w-full border rounded px-3 py-2">
        <option value="standard">Standard</option>
        <option value="legal">Legal</option>
        <option value="medical">Medical</option>
        <option value="conjugal">Conjugal</option>
      </select>
      <input type="datetime-local" value={form.scheduled_at ? form.scheduled_at.slice(0, 16) : ''} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <input type="number" placeholder="Duration (minutes)" value={form.duration_minutes || ''} onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) }))} className="w-full border rounded px-3 py-2" />
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Schedule Visit</button>
    </form>
  );
}
