'use client';

import { useState } from 'react';
import { PrisonInmate, PrisonFacility } from '@/types/prisons';

export function InmateForm({ facilities, onSubmit }: { facilities: PrisonFacility[]; onSubmit: (data: Partial<PrisonInmate>) => void }) {
  const [form, setForm] = useState<Partial<PrisonInmate>>({
    status: 'admitted',
    risk_level: 'medium',
    parole_status: 'not_eligible',
    behavior_score: 50,
    disciplinary_actions: 0,
    good_behavior_credits: 0,
  });

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <select value={form.facility_id || ''} onChange={e => setForm(f => ({ ...f, facility_id: e.target.value }))} className="w-full border rounded px-3 py-2" required>
        <option value="">Select facility...</option>
        {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select>
      <input placeholder="Full Name" value={form.full_name || ''} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <input placeholder="ID Number" value={form.id_number || ''} onChange={e => setForm(f => ({ ...f, id_number: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <div className="grid grid-cols-2 gap-3">
        <input type="date" placeholder="Date of Birth" value={form.date_of_birth || ''} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} className="w-full border rounded px-3 py-2" />
        <select value={form.gender || ''} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} className="w-full border rounded px-3 py-2">
          <option value="">Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
      <input placeholder="Nationality" value={form.nationality || ''} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))} className="w-full border rounded px-3 py-2" />
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Sentence Type" value={form.sentence_type || ''} onChange={e => setForm(f => ({ ...f, sentence_type: e.target.value }))} className="w-full border rounded px-3 py-2" />
        <input type="number" placeholder="Length (months)" value={form.sentence_length_months || ''} onChange={e => setForm(f => ({ ...f, sentence_length_months: parseInt(e.target.value) }))} className="w-full border rounded px-3 py-2" />
      </div>
      <input type="date" placeholder="Sentence Start" value={form.sentence_start || ''} onChange={e => setForm(f => ({ ...f, sentence_start: e.target.value }))} className="w-full border rounded px-3 py-2" />
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Cell Block" value={form.cell_block || ''} onChange={e => setForm(f => ({ ...f, cell_block: e.target.value }))} className="w-full border rounded px-3 py-2" />
        <input placeholder="Cell Number" value={form.cell_number || ''} onChange={e => setForm(f => ({ ...f, cell_number: e.target.value }))} className="w-full border rounded px-3 py-2" />
      </div>
      <select value={form.risk_level} onChange={e => setForm(f => ({ ...f, risk_level: e.target.value as any }))} className="w-full border rounded px-3 py-2">
        <option value="low">Low Risk</option>
        <option value="medium">Medium Risk</option>
        <option value="high">High Risk</option>
        <option value="critical">Critical Risk</option>
      </select>
      <input placeholder="Medical Conditions (comma separated)" onChange={e => setForm(f => ({ ...f, medical_conditions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} className="w-full border rounded px-3 py-2" />
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Register Inmate</button>
    </form>
  );
}
