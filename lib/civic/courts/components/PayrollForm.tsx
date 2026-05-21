'use client';

import { useState } from 'react';
import { CourtPayroll } from '@/types/courts';

export function PayrollForm({ onSubmit }: { onSubmit: (data: Partial<CourtPayroll>) => void }) {
  const [form, setForm] = useState<Partial<CourtPayroll>>({ status: 'pending' });

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
      <div className="grid grid-cols-2 gap-3">
        <input type="date" placeholder="Period Start" value={form.pay_period_start || ''} onChange={e => setForm(f => ({ ...f, pay_period_start: e.target.value }))} className="w-full border rounded px-3 py-2" required />
        <input type="date" placeholder="Period End" value={form.pay_period_end || ''} onChange={e => setForm(f => ({ ...f, pay_period_end: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <input type="number" placeholder="Base" value={form.base_amount || ''} onChange={e => setForm(f => ({ ...f, base_amount: parseFloat(e.target.value) }))} className="w-full border rounded px-3 py-2" required />
        <input type="number" placeholder="Allowances" value={form.allowances || ''} onChange={e => setForm(f => ({ ...f, allowances: parseFloat(e.target.value) }))} className="w-full border rounded px-3 py-2" />
        <input type="number" placeholder="Deductions" value={form.deductions || ''} onChange={e => setForm(f => ({ ...f, deductions: parseFloat(e.target.value) }))} className="w-full border rounded px-3 py-2" />
      </div>
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Create Entry</button>
    </form>
  );
}
