import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFacilities, getFacility, createFacility, updateFacility, deleteFacility } from '@/services/prisonFacilities';
import { PrisonFacility } from '@/types/prisons';

export function useFacilities() {
  return useQuery({ queryKey: ['prisonFacilities'], queryFn: getFacilities });
}

export function useFacility(id: string) {
  return useQuery({ queryKey: ['prisonFacility', id], queryFn: () => getFacility(id), enabled: !!id });
}

export function useCreateFacility() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createFacility, onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonFacilities'] }) });
}

export function useUpdateFacility() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, updates }: { id: string; updates: Partial<PrisonFacility> }) => updateFacility(id, updates), onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonFacilities'] }) });
}

export function useDeleteFacility() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deleteFacility, onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonFacilities'] }) });
}
