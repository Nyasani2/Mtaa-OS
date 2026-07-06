import { usePaginatedQuery } from "./usePaginatedQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLabSamples, createLabSample,
  getLabEquipment, createLabEquipment, updateEquipmentStatus,
  getLabResults, createLabResult,
} from "@/lib/health/services/lab.service";

export function useLabSamples(filter: string) {
  return usePaginatedQuery(["lab-samples", filter], (range) => getLabSamples(filter, range));
}

export function useCreateSample() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createLabSample, onSuccess: () => qc.invalidateQueries({ queryKey: ["lab-samples"] }) });
}

export function useLabEquipment(filter: string) {
  return usePaginatedQuery(["lab-equipment", filter], (range) => getLabEquipment(filter, range));
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
  return usePaginatedQuery(["lab-results", filter], (range) => getLabResults(filter, range));
}

export function useCreateLabResult() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createLabResult, onSuccess: () => qc.invalidateQueries({ queryKey: ["lab-results"] }) });
}
