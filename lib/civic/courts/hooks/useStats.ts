import { useQuery } from '@tanstack/react-query';
import { getCourtStats } from '@/services/courtStats';

export function useCourtStats() {
  return useQuery({ queryKey: ['courtStats'], queryFn: getCourtStats });
}
