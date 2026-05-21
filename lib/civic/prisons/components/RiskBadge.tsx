import { RiskLevel } from '@/types/prisons';

const colors: Record<RiskLevel, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${colors[level] || colors.medium}`}>
      {level}
    </span>
  );
}
