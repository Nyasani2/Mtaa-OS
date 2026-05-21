import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBails, createBail, updateBail, postBail, releaseOnBail } from '@/services/courtBails';
import { CourtBail } from '@/types/courts';

export function useBails(filters?: Parameters<typeof getBails>[0]) {
  return useQuery({ queryKey: ['bails', filters], queryFn: () => getBails(filters) });
}

export function useCreateBail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBail,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bails'] }),
  });
}

export function useUpdateBail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CourtBail> }) => updateBail(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bails'] }),
  });
}

export function usePostBail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, postedBy }: { id: string; postedBy: string }) => postBail(id, postedBy),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bails'] }),
  });
}

export function useReleaseOnBail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: releaseOnBail,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bails'] }),
  });
}
