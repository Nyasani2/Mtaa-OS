'use client';

import { useState } from 'react';
import { CourtStaffAttendance } from '@/types/courts';

export function ClockInForm({ onSubmit }: { onSubmit: (data: Partial<CourtStaffAttendance>) => void }) {
  const [form, setForm] = useState<Partial<CourtStaffAttendance>>({ staff_type: 'clerk' });

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <input placeholder="Court House ID" value={form.court_house_id || ''} onChange={e => setForm(f => ({ ...f, court_house_id: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <input placeholder="Staff ID" value={form.staff_id || ''} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <input placeholder="Staff Name" value={form.staff_name || ''} onChange={e => setForm(f => ({ ...f, staff_name: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <select value={form.staff_type} onChange={e => setForm(f => ({ ...f, staff_type: e.target.value as any }))} className="w-full border rounded px-3 py-2">
        <option value="judge">Judge</option>
        <option value="clerk">Clerk</option>
        <option value="bailiff">Bailiff</option>
        <option value="reporter">Reporter</option>
        <option value="registrar">Registrar</option>
        <option value="security">Security</option>
      </select>
      <input placeholder="Station ID" value={form.station_id || ''} onChange={e => setForm(f => ({ ...f, station_id: e.target.value }))} className="w-full border rounded px-3 py-2" />
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Clock In</button>
    </form>
  );
}
