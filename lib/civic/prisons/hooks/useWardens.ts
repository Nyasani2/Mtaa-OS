import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWardens, createWarden, updateWarden, deleteWarden } from '@/services/prisonWardens';
import { PrisonWarden } from '@/types/prisons';

export function useWardens(facilityId?: string) {
  return useQuery({ queryKey: ['prisonWardens', facilityId], queryFn: () => getWardens(facilityId) });
}

export function useCreateWarden() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createWarden, onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonWardens'] }) });
}

export function useUpdateWarden() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, updates }: { id: string; updates: Partial<PrisonWarden> }) => updateWarden(id, updates), onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonWardens'] }) });
}

export function useDeleteWarden() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deleteWarden, onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonWardens'] }) });
}
