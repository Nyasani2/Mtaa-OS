'use client';
import { useQuery } from '@tanstack/react-query';
import { RecordService } from '../services/record.service';

export function useRecords(patientId: string, type?: string) {
  return useQuery({ queryKey: ['health', 'records', patientId, type], queryFn: () => RecordService.getRecords(patientId, type), enabled: !!patientId });
}
export function usePrescriptions(patientId: string) {
  return useQuery({ queryKey: ['health', 'prescriptions', patientId], queryFn: () => RecordService.getPrescriptions(patientId), enabled: !!patientId });
}
export function useLabTests(patientId: string) {
  return useQuery({ queryKey: ['health', 'lab-tests', patientId], queryFn: () => RecordService.getLabTests(patientId), enabled: !!patientId });
}
