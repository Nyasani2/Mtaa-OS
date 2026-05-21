'use client';

import { useState } from 'react';
import { PrisonWarden, PrisonFacility } from '@/types/prisons';

export function WardenForm({ facilities, onSubmit }: { facilities: PrisonFacility[]; onSubmit: (data: Partial<PrisonWarden>) => void }) {
  const [form, setForm] = useState<Partial<PrisonWarden>>({ shift: 'day', is_active: true });

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <select value={form.facility_id || ''} onChange={e => setForm(f => ({ ...f, facility_id: e.target.value }))} className="w-full border rounded px-3 py-2" required>
        <option value="">Select facility...</option>
        {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select>
      <input placeholder="Full Name" value={form.full_name || ''} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <input placeholder="Warden Number" value={form.warden_number || ''} onChange={e => setForm(f => ({ ...f, warden_number: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <input placeholder="Employee Number" value={form.employee_number || ''} onChange={e => setForm(f => ({ ...f, employee_number: e.target.value }))} className="w-full border rounded px-3 py-2" />
      <input placeholder="Badge Number" value={form.badge_number || ''} onChange={e => setForm(f => ({ ...f, badge_number: e.target.value }))} className="w-full border rounded px-3 py-2" />
      <input placeholder="Rank" value={form.rank || ''} onChange={e => setForm(f => ({ ...f, rank: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <select value={form.shift} onChange={e => setForm(f => ({ ...f, shift: e.target.value }))} className="w-full border rounded px-3 py-2">
        <option value="day">Day</option>
        <option value="night">Night</option>
        <option value="rotating">Rotating</option>
      </select>
      <input placeholder="Phone" value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border rounded px-3 py-2" />
      <input placeholder="Email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full border rounded px-3 py-2" />
      <input type="date" placeholder="Date Hired" value={form.date_hired || ''} onChange={e => setForm(f => ({ ...f, date_hired: e.target.value }))} className="w-full border rounded px-3 py-2" />
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Add Warden</button>
    </form>
  );
}
