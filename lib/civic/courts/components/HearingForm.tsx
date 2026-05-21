'use client';

import { useState } from 'react';
import { CourtHearing } from '@/types/courts';
import { useCreateHearing } from '@/hooks/useHearings';
import { useCourtRooms } from '@/hooks/useCourts';

export function HearingForm({ onSubmit }: { onSubmit: () => void }) {
  const [form, setForm] = useState<Partial<CourtHearing>>({ hearing_type: 'mention', status: 'scheduled' });
  const create = useCreateHearing();
  const { data: rooms } = useCourtRooms();

  return (
    <form onSubmit={e => { e.preventDefault(); create.mutateAsync(form).then(onSubmit); }} className="space-y-3">
      <input placeholder="Case ID" value={form.case_id || ''} onChange={e => setForm(f => ({ ...f, case_id: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <select value={form.court_room_id || ''} onChange={e => setForm(f => ({ ...f, court_room_id: e.target.value }))} className="w-full border rounded px-3 py-2" required>
        <option value="">Select room...</option>
        {rooms?.map(r => <option key={r.id} value={r.id}>{r.room_number} ({r.room_type})</option>)}
      </select>
      <select value={form.hearing_type} onChange={e => setForm(f => ({ ...f, hearing_type: e.target.value as any }))} className="w-full border rounded px-3 py-2">
        <option value="mention">Mention</option>
        <option value="pretrial">Pretrial</option>
        <option value="trial">Trial</option>
        <option value="sentencing">Sentencing</option>
        <option value="ruling">Ruling</option>
      </select>
      <input type="datetime-local" value={form.scheduled_date ? form.scheduled_date.slice(0, 16) : ''} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} className="w-full border rounded px-3 py-2" required />
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Schedule</button>
    </form>
  );
}
