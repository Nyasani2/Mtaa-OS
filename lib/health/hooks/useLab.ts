import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLabSamples, createLabSample, getLabEquipment, createLabEquipment, updateEquipmentStatus, getLabResults, createLabResult } from "@/lib/health/services/lab.service";

export function useLabSamples(filter: string) {
  return useQuery({ queryKey: ["lab-samples", filter], queryFn: () => getLabSamples(filter) });
}
export function useCreateSample() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createLabSample, onSuccess: () => qc.invalidateQueries({ queryKey: ["lab-samples"] }) });
}
export function useLabEquipment(filter: string) {
  return useQuery({ queryKey: ["lab-equipment", filter], queryFn: () => getLabEquipment(filter) });
}
export function useCreateEquipment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createLabEquipment, onSuccess: () => qc.invalidateQueries({ queryKey: ["lab-equipment"] }) });
}
export function useUpdateEquipmentStatus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: updateEquipmentStatus, onSuccess: () => qc.invalidateQueries({ queryKey: ["lab-equipment"] }) });
}
export function useLabResults(filter: string) {
  return useQuery({ queryKey: ["lab-results", filter], queryFn: () => getLabResults(filter) });
}
export function useCreateLabResult() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createLabResult, onSuccess: () => qc.invalidateQueries({ queryKey: ["lab-results"] }) });
}
