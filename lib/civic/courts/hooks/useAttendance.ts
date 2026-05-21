import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAttendance, clockIn, clockOut } from '@/services/courtAttendance';
import { CourtStaffAttendance } from '@/types/courts';

export function useAttendance(filters?: Parameters<typeof getAttendance>[0]) {
  return useQuery({ queryKey: ['attendance', filters], queryFn: () => getAttendance(filters) });
}

export function useClockIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clockIn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance'] }),
  });
}

export function useClockOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clockOut,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance'] }),
  });
}
