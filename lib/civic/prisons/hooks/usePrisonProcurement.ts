import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProcurement, createProcurement, updateProcurement } from '@/services/prisonProcurement';
import { PrisonProcurement } from '@/types/prisons';

export function usePrisonProcurement(filters?: Parameters<typeof getProcurement>[0]) {
  return useQuery({ queryKey: ['prisonProcurement', filters], queryFn: () => getProcurement(filters) });
}

export function useCreatePrisonProcurement() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createProcurement, onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonProcurement'] }) });
}

export function useUpdatePrisonProcurement() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, updates }: { id: string; updates: Partial<PrisonProcurement> }) => updateProcurement(id, updates), onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonProcurement'] }) });
}
