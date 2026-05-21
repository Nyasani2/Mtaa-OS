import { useQuery } from '@tanstack/react-query';
import { getPrisonStats } from '@/services/prisonStats';

export function usePrisonStats() {
  return useQuery({ queryKey: ['prisonStats'], queryFn: getPrisonStats });
}
