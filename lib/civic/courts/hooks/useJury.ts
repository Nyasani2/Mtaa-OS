import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJuryPool, createJuror, updateJuror, getJuryAssignments, assignJuror, removeJurorAssignment } from '@/services/courtJury';
import { CourtJuror, CourtJuryAssignment } from '@/types/courts';

export function useJuryPool(houseId?: string) {
  return useQuery({ queryKey: ['juryPool', houseId], queryFn: () => getJuryPool(houseId) });
}

export function useCreateJuror() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createJuror,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['juryPool'] }),
  });
}

export function useUpdateJuror() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CourtJuror> }) => updateJuror(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['juryPool'] }),
  });
}

export function useJuryAssignments(caseId?: string) {
  return useQuery({ queryKey: ['juryAssignments', caseId], queryFn: () => getJuryAssignments(caseId) });
}

export function useAssignJuror() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assignJuror,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['juryAssignments'] }),
  });
}

export function useRemoveJurorAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeJurorAssignment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['juryAssignments'] }),
  });
}
