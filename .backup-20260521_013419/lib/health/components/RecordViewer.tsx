'use client';
import { useRecords } from '../hooks/useRecords';
import { FileText, Download, Lock } from 'lucide-react';

export function RecordViewer({ patientId }: { patientId: string }) {
  const { data: records, isLoading } = useRecords(patientId);
  if (isLoading) return <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />)}</div>;
  const typeColors: Record<string, string> = { diagnosis: 'bg-blue-50 text-blue-700', prescription: 'bg-emerald-50 text-emerald-700', lab_result: 'bg-purple-50 text-purple-700', imaging: 'bg-amber-50 text-amber-700', vaccination: 'bg-cyan-50 text-cyan-700', surgery: 'bg-rose-50 text-rose-700', referral: 'bg-gray-50 text-gray-700', note: 'bg-gray-50 text-gray-600' };
  return (
    <div className="space-y-3">
      {records?.map((record) => (
        <div key={record.id} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${typeColors[record.record_type] || 'bg-gray-50'}`}><FileText className="w-5 h-5" /></div>
              <div>
                <div className="flex items-center gap-2"><h4 className="font-semibold text-gray-900">{record.title}</h4>{record.is_confidential && <Lock className="w-4 h-4 text-amber-500" />}</div>
                <p className="text-sm text-gray-500 mt-0.5">{record.health_providers?.full_name} · {record.health_providers?.specialty} · {new Date(record.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${typeColors[record.record_type] || 'bg-gray-50'}`}>{record.record_type.replace('_', ' ')}</span>
          </div>
          {record.description && <p className="mt-3 text-sm text-gray-600">{record.description}</p>}
          {record.attachments?.length > 0 && (
            <div className="mt-3 flex gap-2">
              {record.attachments.map((url: string, i: number) => (
                <a key={i} href={url} target="_blank" className="flex items-center gap-1 text-sm text-emerald-600 hover:underline"><Download className="w-4 h-4" /> Attachment {i + 1}</a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
