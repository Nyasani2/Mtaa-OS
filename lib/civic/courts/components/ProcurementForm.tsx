'use client';

import { useState } from 'react';
import { CourtProcurement } from '@/types/courts';

export function ProcurementForm({ onSubmit }: { onSubmit: (data: Partial<CourtProcurement>) => void }) {
  const [form, setForm] = useState<Partial<CourtProcurement>>({ category: 'stationery', status: 'requested' });

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <input placeholder="Court House ID" value={form.court_house_id || ''} onChange={e => setForm(f => ({ ...f, court_house_id: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <input placeholder="Item Name" value={form.item_name || ''} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))} className="w-full border rounded px-3 py-2">
        <option value="stationery">Stationery</option>
        <option value="furniture">Furniture</option>
        <option value="equipment">Equipment</option>
        <option value="vehicle">Vehicle</option>
        <option value="software">Software</option>
        <option value="security">Security</option>
        <option value="maintenance">Maintenance</option>
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input type="number" placeholder="Quantity" value={form.quantity || ''} onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) }))} className="w-full border rounded px-3 py-2" required />
        <input type="number" placeholder="Unit Cost (KES)" value={form.unit_cost || ''} onChange={e => setForm(f => ({ ...f, unit_cost: parseFloat(e.target.value) }))} className="w-full border rounded px-3 py-2" required />
      </div>
      <input placeholder="Vendor Name" value={form.vendor_name || ''} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))} className="w-full border rounded px-3 py-2" />
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Submit Request</button>
    </form>
  );
}
