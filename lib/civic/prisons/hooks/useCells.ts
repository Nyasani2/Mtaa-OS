import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCells, getCell, createCell, updateCell, deleteCell } from '@/services/prisonCells';
import { PrisonCell } from '@/types/prisons';

export function useCells(facilityId?: string) {
  return useQuery({ queryKey: ['prisonCells', facilityId], queryFn: () => getCells(facilityId) });
}

export function useCell(id: string) {
  return useQuery({ queryKey: ['prisonCell', id], queryFn: () => getCell(id), enabled: !!id });
}

export function useCreateCell() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createCell, onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonCells'] }) });
}

export function useUpdateCell() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, updates }: { id: string; updates: Partial<PrisonCell> }) => updateCell(id, updates), onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonCells'] }) });
}

export function useDeleteCell() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deleteCell, onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonCells'] }) });
}
