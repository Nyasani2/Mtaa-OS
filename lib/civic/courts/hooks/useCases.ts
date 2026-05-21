import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCases, getCase, createCase, updateCase, deleteCase, addParty, removeParty } from '@/services/courtCases';
import { CourtCase, CourtParty } from '@/types/courts';

export function useCases(filters?: Parameters<typeof getCases>[0]) {
  return useQuery({ queryKey: ['cases', filters], queryFn: () => getCases(filters) });
}

export function useCase(id: string) {
  return useQuery({ queryKey: ['case', id], queryFn: () => getCase(id), enabled: !!id });
}

export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCase,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases'] }),
  });
}

export function useUpdateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CourtCase> }) => updateCase(id, updates),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['cases'] });
      qc.invalidateQueries({ queryKey: ['case', vars.id] });
    },
  });
}

export function useDeleteCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCase,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases'] }),
  });
}

export function useAddParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addParty,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases'] }),
  });
}

export function useRemoveParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeParty,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases'] }),
  });
}
