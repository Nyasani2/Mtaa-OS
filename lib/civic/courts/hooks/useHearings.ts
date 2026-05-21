import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHearings, createHearing, updateHearing, deleteHearing } from '@/services/courtHearings';
import { CourtHearing } from '@/types/courts';

export function useHearings(filters?: Parameters<typeof getHearings>[0]) {
  return useQuery({ queryKey: ['hearings', filters], queryFn: () => getHearings(filters) });
}

export function useCreateHearing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createHearing,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hearings'] }),
  });
}

export function useUpdateHearing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CourtHearing> }) => updateHearing(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hearings'] }),
  });
}

export function useDeleteHearing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteHearing,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hearings'] }),
  });
}
