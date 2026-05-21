import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPayroll, createPayrollEntry, approvePayroll, markPaid } from '@/services/prisonPayroll';
import { PrisonPayroll } from '@/types/prisons';

export function usePrisonPayroll(filters?: Parameters<typeof getPayroll>[0]) {
  return useQuery({ queryKey: ['prisonPayroll', filters], queryFn: () => getPayroll(filters) });
}

export function useCreatePrisonPayroll() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createPayrollEntry, onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonPayroll'] }) });
}

export function useApprovePrisonPayroll() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: approvePayroll, onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonPayroll'] }) });
}

export function useMarkPrisonPaid() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, transactionRef }: { id: string; transactionRef: string }) => markPaid(id, transactionRef), onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonPayroll'] }) });
}
