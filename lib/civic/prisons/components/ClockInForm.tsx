'use client';

import { useState } from 'react';
import { PrisonStaffAttendance } from '@/types/prisons';

export function ClockInForm({ onSubmit }: { onSubmit: (data: Partial<PrisonStaffAttendance>) => void }) {
  const [form, setForm] = useState<Partial<PrisonStaffAttendance>>({ staff_type: 'guard' });

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <input placeholder="Facility ID" value={form.facility_id || ''} onChange={e => setForm(f => ({ ...f, facility_id: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <input placeholder="Staff ID" value={form.staff_id || ''} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <input placeholder="Staff Name" value={form.staff_name || ''} onChange={e => setForm(f => ({ ...f, staff_name: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <select value={form.staff_type} onChange={e => setForm(f => ({ ...f, staff_type: e.target.value as any }))} className="w-full border rounded px-3 py-2">
        <option value="warden">Warden</option>
        <option value="guard">Guard</option>
        <option value="medical">Medical</option>
        <option value="counselor">Counselor</option>
        <option value="kitchen">Kitchen</option>
        <option value="maintenance">Maintenance</option>
        <option value="admin">Admin</option>
      </select>
      <input placeholder="Tower ID" value={form.tower_id || ''} onChange={e => setForm(f => ({ ...f, tower_id: e.target.value }))} className="w-full border rounded px-3 py-2" />
      <input placeholder="Cell Block ID" value={form.cell_block_id || ''} onChange={e => setForm(f => ({ ...f, cell_block_id: e.target.value }))} className="w-full border rounded px-3 py-2" />
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Clock In</button>
    </form>
  );
}
