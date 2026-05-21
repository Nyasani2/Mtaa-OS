'use client';

import { useState } from 'react';
import { CourtCase, CourtHouse } from '@/types/courts';

export function CaseForm({ houses, onSubmit }: { houses: CourtHouse[]; onSubmit: (data: Partial<CourtCase>) => void }) {
  const [form, setForm] = useState<Partial<CourtCase>>({
    case_type: 'criminal',
    case_category: 'felony',
    priority: 'normal',
    status: 'filed',
  });

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Court House</label>
        <select value={form.court_house_id || ''} onChange={e => setForm(f => ({ ...f, court_house_id: e.target.value }))} className="w-full border rounded px-3 py-2" required>
          <option value="">Select court...</option>
          {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Case Type</label>
          <select value={form.case_type} onChange={e => setForm(f => ({ ...f, case_type: e.target.value as any }))} className="w-full border rounded px-3 py-2">
            <option value="criminal">Criminal</option>
            <option value="civil">Civil</option>
            <option value="family">Family</option>
            <option value="traffic">Traffic</option>
            <option value="small_claims">Small Claims</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select value={form.case_category} onChange={e => setForm(f => ({ ...f, case_category: e.target.value as any }))} className="w-full border rounded px-3 py-2">
            <option value="felony">Felony</option>
            <option value="misdemeanor">Misdemeanor</option>
            <option value="petty">Petty</option>
            <option value="civil_suit">Civil Suit</option>
            <option value="traffic_violation">Traffic Violation</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Priority</label>
        <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as any }))} className="w-full border rounded px-3 py-2">
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Police Case Ref</label>
        <input type="text" value={form.police_case_ref || ''} onChange={e => setForm(f => ({ ...f, police_case_ref: e.target.value }))} className="w-full border rounded px-3 py-2" />
      </div>
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Create Case</button>
    </form>
  );
}
