import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCourtJudges, createCourtJudge, updateCourtJudge, deleteCourtJudge } from '@/services/courtJudges';
import { CourtJudge } from '@/types/courts';

export function useCourtJudges(houseId?: string) {
  return useQuery({ queryKey: ['courtJudges', houseId], queryFn: () => getCourtJudges(houseId) });
}

export function useCreateJudge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCourtJudge,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courtJudges'] }),
  });
}

export function useUpdateJudge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CourtJudge> }) => updateCourtJudge(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courtJudges'] }),
  });
}

export function useDeleteJudge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCourtJudge,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courtJudges'] }),
  });
}
