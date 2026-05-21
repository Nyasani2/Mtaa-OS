'use client';

import { useState } from 'react';
import { PrisonParoleReview } from '@/types/prisons';

export function ParoleReviewForm({ onSubmit }: { onSubmit: (data: Partial<PrisonParoleReview>) => void }) {
  const [form, setForm] = useState<Partial<PrisonParoleReview>>({ review_type: 'scheduled', decision: 'pending' });

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <input placeholder="Inmate ID" value={form.inmate_id || ''} onChange={e => setForm(f => ({ ...f, inmate_id: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <input type="date" value={form.review_date || ''} onChange={e => setForm(f => ({ ...f, review_date: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <select value={form.review_type} onChange={e => setForm(f => ({ ...f, review_type: e.target.value as any }))} className="w-full border rounded px-3 py-2">
        <option value="scheduled">Scheduled</option>
        <option value="early">Early</option>
        <option value="mandatory">Mandatory</option>
        <option value="appeal">Appeal</option>
      </select>
      <input placeholder="Board Members (comma separated)" onChange={e => setForm(f => ({ ...f, board_members: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} className="w-full border rounded px-3 py-2" />
      <textarea placeholder="Rehabilitation Notes" value={form.rehabilitation_notes || ''} onChange={e => setForm(f => ({ ...f, rehabilitation_notes: e.target.value }))} className="w-full border rounded px-3 py-2" rows={3} />
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Schedule Review</button>
    </form>
  );
}
