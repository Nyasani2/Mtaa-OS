'use client';

import { useState } from 'react';
import { PrisonIncident, PrisonFacility } from '@/types/prisons';

export function IncidentForm({ facilities, onSubmit }: { facilities: PrisonFacility[]; onSubmit: (data: Partial<PrisonIncident>) => void }) {
  const [form, setForm] = useState<Partial<PrisonIncident>>({ severity: 'minor', status: 'open' });

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <select value={form.facility_id || ''} onChange={e => setForm(f => ({ ...f, facility_id: e.target.value }))} className="w-full border rounded px-3 py-2" required>
        <option value="">Select facility...</option>
        {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select>
      <input placeholder="Inmate ID (optional)" value={form.inmate_id || ''} onChange={e => setForm(f => ({ ...f, inmate_id: e.target.value }))} className="w-full border rounded px-3 py-2" />
      <input placeholder="Reported By (Warden ID)" value={form.reported_by || ''} onChange={e => setForm(f => ({ ...f, reported_by: e.target.value }))} className="w-full border rounded px-3 py-2" />
      <select value={form.incident_type} onChange={e => setForm(f => ({ ...f, incident_type: e.target.value as any }))} className="w-full border rounded px-3 py-2">
        <option value="assault">Assault</option>
        <option value="escape_attempt">Escape Attempt</option>
        <option value="contraband">Contraband</option>
        <option value="self_harm">Self Harm</option>
        <option value="death">Death</option>
        <option value="riot">Riot</option>
        <option value="property_damage">Property Damage</option>
        <option value="medical_emergency">Medical Emergency</option>
        <option value="other">Other</option>
      </select>
      <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value as any }))} className="w-full border rounded px-3 py-2">
        <option value="minor">Minor</option>
        <option value="moderate">Moderate</option>
        <option value="major">Major</option>
        <option value="critical">Critical</option>
      </select>
      <input placeholder="Location" value={form.location || ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="w-full border rounded px-3 py-2" />
      <textarea placeholder="Description" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border rounded px-3 py-2" rows={3} required />
      <input placeholder="Witnesses (comma separated)" onChange={e => setForm(f => ({ ...f, witnesses: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} className="w-full border rounded px-3 py-2" />
      <button type="submit" className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700">Report Incident</button>
    </form>
  );
}
