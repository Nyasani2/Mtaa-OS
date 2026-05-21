import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getParoleReviews, createParoleReview, updateParoleReview, makeParoleDecision } from '@/services/prisonParole';
import { PrisonParoleReview } from '@/types/prisons';

export function useParoleReviews(filters?: Parameters<typeof getParoleReviews>[0]) {
  return useQuery({ queryKey: ['prisonParole', filters], queryFn: () => getParoleReviews(filters) });
}

export function useCreateParoleReview() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createParoleReview, onSuccess: () => { qc.invalidateQueries({ queryKey: ['prisonParole'] }); qc.invalidateQueries({ queryKey: ['prisonInmates'] }); } });
}

export function useUpdateParoleReview() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, updates }: { id: string; updates: Partial<PrisonParoleReview> }) => updateParoleReview(id, updates), onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonParole'] }) });
}

export function useMakeParoleDecision() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, decision, conditions }: { id: string; decision: string; conditions: string[] }) => makeParoleDecision(id, decision, conditions), onSuccess: () => { qc.invalidateQueries({ queryKey: ['prisonParole'] }); qc.invalidateQueries({ queryKey: ['prisonInmates'] }); } });
}
