'use client';

import { useState } from 'react';
import { PrisonPayroll } from '@/types/prisons';

export function PayrollForm({ onSubmit }: { onSubmit: (data: Partial<PrisonPayroll>) => void }) {
  const [form, setForm] = useState<Partial<PrisonPayroll>>({ status: 'pending' });

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
      <div className="grid grid-cols-2 gap-3">
        <input type="date" value={form.pay_period_start || ''} onChange={e => setForm(f => ({ ...f, pay_period_start: e.target.value }))} className="w-full border rounded px-3 py-2" required />
        <input type="date" value={form.pay_period_end || ''} onChange={e => setForm(f => ({ ...f, pay_period_end: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      </div>
      <div className="grid grid-cols-4 gap-3">
        <input type="number" placeholder="Base" value={form.base_amount || ''} onChange={e => setForm(f => ({ ...f, base_amount: parseFloat(e.target.value) }))} className="w-full border rounded px-3 py-2" required />
        <input type="number" placeholder="Hazard" value={form.hazard_allowance || ''} onChange={e => setForm(f => ({ ...f, hazard_allowance: parseFloat(e.target.value) }))} className="w-full border rounded px-3 py-2" />
        <input type="number" placeholder="OT" value={form.overtime || ''} onChange={e => setForm(f => ({ ...f, overtime: parseFloat(e.target.value) }))} className="w-full border rounded px-3 py-2" />
        <input type="number" placeholder="Deductions" value={form.deductions || ''} onChange={e => setForm(f => ({ ...f, deductions: parseFloat(e.target.value) }))} className="w-full border rounded px-3 py-2" />
      </div>
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Create Entry</button>
    </form>
  );
}
