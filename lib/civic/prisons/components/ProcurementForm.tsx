'use client';

import { useState } from 'react';
import { PrisonProcurement } from '@/types/prisons';

export function ProcurementForm({ onSubmit }: { onSubmit: (data: Partial<PrisonProcurement>) => void }) {
  const [form, setForm] = useState<Partial<PrisonProcurement>>({ category: 'security_equipment', urgency: 'normal', status: 'requested' });

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <input placeholder="Facility ID" value={form.facility_id || ''} onChange={e => setForm(f => ({ ...f, facility_id: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <input placeholder="Item Name" value={form.item_name || ''} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))} className="w-full border rounded px-3 py-2">
        <option value="security_equipment">Security Equipment</option>
        <option value="medical">Medical</option>
        <option value="food">Food</option>
        <option value="uniforms">Uniforms</option>
        <option value="rehabilitation">Rehabilitation</option>
        <option value="maintenance">Maintenance</option>
        <option value="technology">Technology</option>
        <option value="furniture">Furniture</option>
        <option value="vehicles">Vehicles</option>
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input type="number" placeholder="Quantity" value={form.quantity || ''} onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) }))} className="w-full border rounded px-3 py-2" required />
        <input type="number" placeholder="Unit Cost (KES)" value={form.unit_cost || ''} onChange={e => setForm(f => ({ ...f, unit_cost: parseFloat(e.target.value) }))} className="w-full border rounded px-3 py-2" required />
      </div>
      <select value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value as any }))} className="w-full border rounded px-3 py-2">
        <option value="low">Low</option>
        <option value="normal">Normal</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>
      <input placeholder="Vendor Name" value={form.vendor_name || ''} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))} className="w-full border rounded px-3 py-2" />
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Submit Request</button>
    </form>
  );
}
