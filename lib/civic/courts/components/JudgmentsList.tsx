import { CourtJudgment } from '@/types/courts';
import { formatDate } from '@/lib/utils';

export function JudgmentsList({ judgments, caseId }: { judgments: CourtJudgment[]; caseId?: string }) {
  return (
    <div className="space-y-2">
      {judgments.map(j => (
        <div key={j.id} className="border rounded p-3 text-sm">
          <div className="flex justify-between">
            <span className="font-medium capitalize">{j.judgment_type.replace('_', ' ')}</span>
            <span className="text-xs text-gray-500">{formatDate(j.delivered_date)}</span>
          </div>
          {j.sentence_type && (
            <div className="text-gray-600 mt-1">
              Sentence: <span className="capitalize">{j.sentence_type.replace('_', ' ')}</span>
              {j.sentence_duration_months && ` (${j.sentence_duration_months} months)`}
            </div>
          )}
          {j.fine_amount > 0 && <div className="text-red-600">Fine: KES {j.fine_amount.toLocaleString()}</div>}
          {j.judge && <div className="text-xs text-gray-500 mt-1">By: {j.judge.full_name}</div>}
          {j.is_appealable && <div className="text-xs text-amber-600 mt-1">Appealable until {formatDate(j.appeal_deadline)}</div>}
        </div>
      ))}
      {judgments.length === 0 && <div className="text-gray-400 text-sm">No judgments recorded</div>}
    </div>
  );
}
