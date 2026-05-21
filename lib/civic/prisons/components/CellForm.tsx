'use client';

import { useState } from 'react';
import { PrisonCell, PrisonFacility } from '@/types/prisons';

export function CellForm({ facilities, onSubmit }: { facilities: PrisonFacility[]; onSubmit: (data: Partial<PrisonCell>) => void }) {
  const [form, setForm] = useState<Partial<PrisonCell>>({ cell_type: 'general', security_level: 'medium', capacity: 2 });

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <select value={form.facility_id || ''} onChange={e => setForm(f => ({ ...f, facility_id: e.target.value }))} className="w-full border rounded px-3 py-2" required>
        <option value="">Select facility...</option>
        {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select>
      <input placeholder="Cell Block" value={form.cell_block || ''} onChange={e => setForm(f => ({ ...f, cell_block: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <input placeholder="Cell Number" value={form.cell_number || ''} onChange={e => setForm(f => ({ ...f, cell_number: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <input type="number" placeholder="Capacity" value={form.capacity || ''} onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) }))} className="w-full border rounded px-3 py-2" required />
      <select value={form.cell_type} onChange={e => setForm(f => ({ ...f, cell_type: e.target.value as any }))} className="w-full border rounded px-3 py-2">
        <option value="general">General</option>
        <option value="solitary">Solitary</option>
        <option value="medical">Medical</option>
        <option value="protective_custody">Protective Custody</option>
        <option value="death_row">Death Row</option>
        <option value="juvenile">Juvenile</option>
      </select>
      <select value={form.security_level} onChange={e => setForm(f => ({ ...f, security_level: e.target.value as any }))} className="w-full border rounded px-3 py-2">
        <option value="minimum">Minimum</option>
        <option value="medium">Medium</option>
        <option value="maximum">Maximum</option>
        <option value="supermax">Supermax</option>
      </select>
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Add Cell</button>
    </form>
  );
}
