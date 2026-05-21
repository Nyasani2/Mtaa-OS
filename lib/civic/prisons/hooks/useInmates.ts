import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInmates, getInmate, createInmate, updateInmate, deleteInmate, assignCell, releaseInmate, transferInmate } from '@/services/prisonInmates';
import { PrisonInmate } from '@/types/prisons';

export function useInmates(filters?: Parameters<typeof getInmates>[0]) {
  return useQuery({ queryKey: ['prisonInmates', filters], queryFn: () => getInmates(filters) });
}

export function useInmate(id: string) {
  return useQuery({ queryKey: ['prisonInmate', id], queryFn: () => getInmate(id), enabled: !!id });
}

export function useCreateInmate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createInmate, onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonInmates'] }) });
}

export function useUpdateInmate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, updates }: { id: string; updates: Partial<PrisonInmate> }) => updateInmate(id, updates), onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['prisonInmates'] }); qc.invalidateQueries({ queryKey: ['prisonInmate', v.id] }); } });
}

export function useDeleteInmate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deleteInmate, onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonInmates'] }) });
}

export function useAssignCell() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ inmateId, cellBlock, cellNumber }: { inmateId: string; cellBlock: string; cellNumber: string }) => assignCell(inmateId, cellBlock, cellNumber), onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonInmates', 'prisonCells'] }) });
}

export function useReleaseInmate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: releaseInmate, onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonInmates'] }) });
}

export function useTransferInmate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, toFacilityId, reason }: { id: string; toFacilityId: string; reason: string }) => transferInmate(id, toFacilityId, reason), onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonInmates', 'prisonMovements'] }) });
}
