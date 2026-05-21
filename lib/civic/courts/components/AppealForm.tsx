'use client';

import { useState } from 'react';
import { CourtAppeal } from '@/types/courts';

export function AppealForm({ onSubmit }: { onSubmit: (data: Partial<CourtAppeal>) => void }) {
  const [form, setForm] = useState<Partial<CourtAppeal>>({ appeal_type: 'appeal_against_conviction', status: 'filed' });

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <input placeholder="Original Case ID" value={form.original_case_id || ''} onChange={e => setForm(f => ({ ...f, original_case_id: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <input placeholder="Original Judgment ID" value={form.original_judgment_id || ''} onChange={e => setForm(f => ({ ...f, original_judgment_id: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <input placeholder="Appeal Case Number" value={form.appeal_case_number || ''} onChange={e => setForm(f => ({ ...f, appeal_case_number: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <input placeholder="Appellant Party ID" value={form.appellant_party_id || ''} onChange={e => setForm(f => ({ ...f, appellant_party_id: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <select value={form.appeal_type} onChange={e => setForm(f => ({ ...f, appeal_type: e.target.value as any }))} className="w-full border rounded px-3 py-2">
        <option value="appeal_against_conviction">Against Conviction</option>
        <option value="appeal_against_sentence">Against Sentence</option>
        <option value="appeal_against_acquittal">Against Acquittal</option>
        <option value="civil_appeal">Civil Appeal</option>
      </select>
      <textarea placeholder="Grounds of appeal" value={form.grounds || ''} onChange={e => setForm(f => ({ ...f, grounds: e.target.value }))} className="w-full border rounded px-3 py-2" rows={3} required />
      <input placeholder="Appellate Court ID" value={form.appellate_court_id || ''} onChange={e => setForm(f => ({ ...f, appellate_court_id: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">File Appeal</button>
    </form>
  );
}
