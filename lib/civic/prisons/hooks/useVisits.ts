import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVisits, createVisit, updateVisit, checkInVisit, checkOutVisit } from '@/services/prisonVisits';
import { PrisonVisit } from '@/types/prisons';

export function useVisits(filters?: Parameters<typeof getVisits>[0]) {
  return useQuery({ queryKey: ['prisonVisits', filters], queryFn: () => getVisits(filters) });
}

export function useCreateVisit() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createVisit, onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonVisits'] }) });
}

export function useUpdateVisit() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, updates }: { id: string; updates: Partial<PrisonVisit> }) => updateVisit(id, updates), onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonVisits'] }) });
}

export function useCheckInVisit() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: checkInVisit, onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonVisits'] }) });
}

export function useCheckOutVisit() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: checkOutVisit, onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonVisits'] }) });
}
