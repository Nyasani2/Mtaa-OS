import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAppeals, createAppeal, updateAppeal } from '@/services/courtAppeals';
import { CourtAppeal } from '@/types/courts';

export function useAppeals() {
  return useQuery({ queryKey: ['appeals'], queryFn: getAppeals });
}

export function useCreateAppeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAppeal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appeals'] }),
  });
}

export function useUpdateAppeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CourtAppeal> }) => updateAppeal(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appeals'] }),
  });
}
