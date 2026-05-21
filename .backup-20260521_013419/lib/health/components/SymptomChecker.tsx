'use client';
import { useState } from 'react';
import { useCheckSymptoms } from '../hooks/useSymptomChecker';
import { Activity, AlertTriangle, Stethoscope, Home, ArrowRight } from 'lucide-react';

const commonSymptoms = ['Fever', 'Headache', 'Cough', 'Fatigue', 'Nausea', 'Chest Pain', 'Shortness of Breath', 'Dizziness', 'Rash', 'Joint Pain', 'Sore Throat', 'Abdominal Pain'];
const bodyAreas = ['Head', 'Chest', 'Abdomen', 'Back', 'Arms', 'Legs', 'Skin', 'General'];

export function SymptomChecker({ patientId }: { patientId: string }) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('mild');
  const [duration, setDuration] = useState(1);
  const [result, setResult] = useState<any>(null);
  const checkSymptoms = useCheckSymptoms();
  const toggleSymptom = (symptom: string) => setSelectedSymptoms(p => p.includes(symptom) ? p.filter(s => s !== symptom) : [...p, symptom]);
  const toggleArea = (area: string) => setSelectedAreas(p => p.includes(area) ? p.filter(a => a !== area) : [...p, area]);
  const handleCheck = async () => {
    if (selectedSymptoms.length === 0) return;
    const data = await checkSymptoms.mutateAsync({ patient_id: patientId, symptoms: selectedSymptoms, severity, duration_days: duration, body_areas: selectedAreas });
    setResult(data);
  };
  const urgencyConfig: Record<string, { color: string; icon: any; label: string; action: string }> = {
    self_care: { color: 'bg-emerald-50 text-emerald-700', icon: Home, label: 'Self Care', action: 'Rest and monitor symptoms. Consult if they worsen.' },
    primary_care: { color: 'bg-blue-50 text-blue-700', icon: Stethoscope, label: 'Primary Care', action: 'Schedule an appointment with a general practitioner.' },
    urgent_care: { color: 'bg-amber-50 text-amber-700', icon: AlertTriangle, label: 'Urgent Care', action: 'Visit urgent care within 24 hours.' },
    emergency: { color: 'bg-red-50 text-red-700', icon: Activity, label: 'Emergency', action: 'Seek emergency care immediately.' },
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-600" /> Symptom Checker</h3>
      {!result ? (
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-gray-700 mb-2 block">Select Symptoms</label><div className="flex flex-wrap gap-2">{commonSymptoms.map(s => <button key={s} onClick={() => toggleSymptom(s)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedSymptoms.includes(s) ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{s}</button>)}</div></div>
          <div><label className="text-sm font-medium text-gray-700 mb-2 block">Body Areas Affected</label><div className="flex flex-wrap gap-2">{bodyAreas.map(a => <button key={a} onClick={() => toggleArea(a)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedAreas.includes(a) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{a}</button>)}</div></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-gray-700 mb-2 block">Severity</label><select value={severity} onChange={e => setSeverity(e.target.value as any)} className="w-full p-2 border border-gray-200 rounded-lg text-sm"><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option></select></div>
            <div><label className="text-sm font-medium text-gray-700 mb-2 block">Duration (days)</label><input type="number" min={1} max={365} value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full p-2 border border-gray-200 rounded-lg text-sm" /></div>
          </div>
          <button onClick={handleCheck} disabled={selectedSymptoms.length === 0 || checkSymptoms.isPending} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">{checkSymptoms.isPending ? 'Analyzing...' : <>Check Symptoms <ArrowRight className="w-4 h-4" /></>}</button>
        </div>
      ) : (
        <div className="space-y-4">
          {(() => { const c = urgencyConfig[result.recommended_urgency] || urgencyConfig.self_care; const I = c.icon; return (
            <div className={`p-4 rounded-xl ${c.color}`}><div className="flex items-center gap-3"><I className="w-6 h-6" /><div><p className="font-semibold">{c.label}</p><p className="text-sm mt-1">{c.action}</p></div></div></div>
          ); })()}
          {result.recommended_specialty && <div className="p-4 bg-gray-50 rounded-xl"><p className="text-sm font-medium text-gray-700">Recommended Specialty</p><p className="text-lg font-semibold text-gray-900 mt-1">{result.recommended_specialty}</p></div>}
          <button onClick={() => { setResult(null); setSelectedSymptoms([]); setSelectedAreas([]); }} className="w-full py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50">Check Again</button>
        </div>
      )}
    </div>
  );
}
