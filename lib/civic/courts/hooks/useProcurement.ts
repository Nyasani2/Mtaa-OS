import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProcurement, createProcurement, updateProcurement } from '@/services/courtProcurement';
import { CourtProcurement } from '@/types/courts';

export function useProcurement(filters?: Parameters<typeof getProcurement>[0]) {
  return useQuery({ queryKey: ['procurement', filters], queryFn: () => getProcurement(filters) });
}

export function useCreateProcurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProcurement,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement'] }),
  });
}

export function useUpdateProcurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CourtProcurement> }) => updateProcurement(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procurement'] }),
  });
}
