'use client';

import { useState } from 'react';
import { PrisonMovement } from '@/types/prisons';

export function MovementForm({ onSubmit }: { onSubmit: (data: Partial<PrisonMovement>) => void }) {
  const [form, setForm] = useState<Partial<PrisonMovement>>({ movement_type: 'transfer_in' });

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <input placeholder="Inmate ID" value={form.inmate_id || ''} onChange={e => setForm(f => ({ ...f, inmate_id: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <select value={form.movement_type} onChange={e => setForm(f => ({ ...f, movement_type: e.target.value as any }))} className="w-full border rounded px-3 py-2">
        <option value="transfer_in">Transfer In</option>
        <option value="transfer_out">Transfer Out</option>
        <option value="release">Release</option>
        <option value="escape">Escape</option>
        <option value="hospitalization">Hospitalization</option>
        <option value="court_appearance">Court Appearance</option>
      </select>
      <input placeholder="From Facility ID" value={form.from_facility_id || ''} onChange={e => setForm(f => ({ ...f, from_facility_id: e.target.value }))} className="w-full border rounded px-3 py-2" />
      <input placeholder="To Facility ID" value={form.to_facility_id || ''} onChange={e => setForm(f => ({ ...f, to_facility_id: e.target.value }))} className="w-full border rounded px-3 py-2" />
      <input placeholder="Reason" value={form.reason || ''} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Log Movement</button>
    </form>
  );
}
