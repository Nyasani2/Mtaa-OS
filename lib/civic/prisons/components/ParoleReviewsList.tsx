import { PrisonParoleReview } from '@/types/prisons';
import { formatDate } from '@/lib/utils';

const decisionColors: Record<string, string> = {
  granted: 'bg-green-100 text-green-800',
  denied: 'bg-red-100 text-red-800',
  deferred: 'bg-amber-100 text-amber-800',
  pending: 'bg-gray-100 text-gray-800',
};

export function ParoleReviewsList({ reviews, onDecide }: { reviews: PrisonParoleReview[]; onDecide?: (id: string) => void }) {
  return (
    <div className="space-y-2">
      {reviews.map(r => (
        <div key={r.id} className="border rounded p-3 text-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-medium">{r.inmate?.full_name || 'Unknown'}</span>
              <span className="text-gray-500 ml-2 capitalize">{r.review_type}</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded capitalize ${decisionColors[r.decision || 'pending'] || 'bg-gray-100 text-gray-800'}`}>
              {r.decision || 'pending'}
            </span>
          </div>
          <div className="text-gray-500 mt-1">Review Date: {formatDate(r.review_date)}</div>
          {r.behavior_score && <div className="text-xs text-gray-600">Behavior Score: {r.behavior_score}/100</div>}
          {r.work_performance && <div className="text-xs text-gray-600">Work: {r.work_performance}</div>}
          {r.recommendation && <div className="text-xs text-blue-600">Recommendation: {r.recommendation}</div>}
          {r.conditions?.length > 0 && <div className="text-xs text-gray-600">Conditions: {r.conditions.join(', ')}</div>}
          {r.rehabilitation_notes && <div className="text-xs text-gray-500 mt-1">{r.rehabilitation_notes}</div>}
          {onDecide && r.decision === 'pending' && (
            <button onClick={() => onDecide(r.id)} className="mt-2 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Make Decision</button>
          )}
        </div>
      ))}
      {reviews.length === 0 && <div className="text-gray-400 text-sm">No parole reviews</div>}
    </div>
  );
}
