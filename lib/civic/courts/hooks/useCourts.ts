import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCourtHouses, getCourtHouse, createCourtHouse, updateCourtHouse, deleteCourtHouse } from '@/services/courtHouses';
import { CourtHouse } from '@/types/courts';

export function useCourtHouses() {
  return useQuery({ queryKey: ['courtHouses'], queryFn: getCourtHouses });
}

export function useCourtHouse(id: string) {
  return useQuery({ queryKey: ['courtHouse', id], queryFn: () => getCourtHouse(id), enabled: !!id });
}

export function useCreateCourtHouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCourtHouse,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courtHouses'] }),
  });
}

export function useUpdateCourtHouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CourtHouse> }) => updateCourtHouse(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courtHouses'] }),
  });
}

export function useDeleteCourtHouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCourtHouse,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courtHouses'] }),
  });
}
