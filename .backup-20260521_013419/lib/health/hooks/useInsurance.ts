'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InsuranceService } from '../services/insurance.service';

export function useClaims(patientId: string) {
  return useQuery({ queryKey: ['health', 'claims', patientId], queryFn: () => InsuranceService.getClaims(patientId), enabled: !!patientId });
}
export function useSubmitClaim() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: InsuranceService.submitClaim, onSuccess: () => qc.invalidateQueries({ queryKey: ['health', 'claims'] }) });
}
