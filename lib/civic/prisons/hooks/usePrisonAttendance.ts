import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAttendance, clockIn, clockOut } from '@/services/prisonAttendance';
import { PrisonStaffAttendance } from '@/types/prisons';

export function usePrisonAttendance(filters?: Parameters<typeof getAttendance>[0]) {
  return useQuery({ queryKey: ['prisonAttendance', filters], queryFn: () => getAttendance(filters) });
}

export function usePrisonClockIn() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: clockIn, onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonAttendance'] }) });
}

export function usePrisonClockOut() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: clockOut, onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonAttendance'] }) });
}
