import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFines, createFine, updateFine, recordPayment } from '@/services/courtFines';
import { CourtFine } from '@/types/courts';

export function useFines(filters?: Parameters<typeof getFines>[0]) {
  return useQuery({ queryKey: ['fines', filters], queryFn: () => getFines(filters) });
}

export function useCreateFine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createFine,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fines'] }),
  });
}

export function useUpdateFine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CourtFine> }) => updateFine(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fines'] }),
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount, receiptNumber }: { id: string; amount: number; receiptNumber: string }) =>
      recordPayment(id, amount, receiptNumber),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fines'] }),
  });
}
