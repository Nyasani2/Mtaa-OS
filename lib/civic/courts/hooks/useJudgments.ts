import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJudgments, createJudgment, updateJudgment, deleteJudgment } from '@/services/courtJudgments';
import { CourtJudgment } from '@/types/courts';

export function useJudgments(caseId?: string) {
  return useQuery({ queryKey: ['judgments', caseId], queryFn: () => getJudgments(caseId) });
}

export function useCreateJudgment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createJudgment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['judgments'] });
      qc.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

export function useUpdateJudgment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CourtJudgment> }) => updateJudgment(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['judgments'] }),
  });
}

export function useDeleteJudgment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteJudgment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['judgments'] }),
  });
}
