import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getIncidents, createIncident, updateIncident, resolveIncident } from '@/services/prisonIncidents';
import { PrisonIncident } from '@/types/prisons';

export function useIncidents(filters?: Parameters<typeof getIncidents>[0]) {
  return useQuery({ queryKey: ['prisonIncidents', filters], queryFn: () => getIncidents(filters) });
}

export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createIncident, onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonIncidents'] }) });
}

export function useUpdateIncident() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, updates }: { id: string; updates: Partial<PrisonIncident> }) => updateIncident(id, updates), onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonIncidents'] }) });
}

export function useResolveIncident() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, notes }: { id: string; notes: string }) => resolveIncident(id, notes), onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonIncidents'] }) });
}
