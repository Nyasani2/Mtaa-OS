import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPayroll, createPayrollEntry, approvePayroll, markPaid } from '@/services/courtPayroll';
import { CourtPayroll } from '@/types/courts';

export function usePayroll(filters?: Parameters<typeof getPayroll>[0]) {
  return useQuery({ queryKey: ['payroll', filters], queryFn: () => getPayroll(filters) });
}

export function useCreatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPayrollEntry,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll'] }),
  });
}

export function useApprovePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: approvePayroll,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll'] }),
  });
}

export function useMarkPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, transactionRef }: { id: string; transactionRef: string }) => markPaid(id, transactionRef),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll'] }),
  });
}
