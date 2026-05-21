import { CourtParty } from '@/types/courts';
import { useState } from 'react';

export function PartyList({ parties, caseId, onAdd }: { parties: CourtParty[]; caseId: string; onAdd: any }) {
  const [form, setForm] = useState({ party_type: 'defendant' as const, full_name: '', id_number: '', phone: '' });
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-3">
      {parties.map(p => (
        <div key={p.id} className="border rounded p-3 text-sm">
          <div className="flex justify-between">
            <span className="font-medium">{p.full_name}</span>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded capitalize">{p.party_type}</span>
          </div>
          {p.id_number && <div className="text-gray-500">ID: {p.id_number}</div>}
          {p.phone && <div className="text-gray-500">{p.phone}</div>}
          {p.represented_by && <div className="text-blue-600 text-xs">Rep: {p.represented_by}</div>}
        </div>
      ))}
      {showAdd ? (
        <form onSubmit={e => { e.preventDefault(); onAdd.mutate({ ...form, case_id: caseId }); setShowAdd(false); setForm({ party_type: 'defendant', full_name: '', id_number: '', phone: '' }); }} className="space-y-2">
          <select value={form.party_type} onChange={e => setForm(f => ({ ...f, party_type: e.target.value as any }))} className="w-full border rounded px-2 py-1 text-sm">
            <option value="plaintiff">Plaintiff</option>
            <option value="defendant">Defendant</option>
            <option value="witness">Witness</option>
          </select>
          <input placeholder="Full name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm" required />
          <input placeholder="ID Number" value={form.id_number} onChange={e => setForm(f => ({ ...f, id_number: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm" />
          <input placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm" />
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Add</button>
            <button type="button" onClick={() => setShowAdd(false)} className="text-gray-500 text-sm">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowAdd(true)} className="text-blue-600 text-sm hover:underline">+ Add Party</button>
      )}
    </div>
  );
}
