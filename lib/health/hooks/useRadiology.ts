import { usePaginatedQuery } from "./usePaginatedQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getRadiologyReports, createRadiologyReport, getRadiologyRequests, createRadiologyRequest } from "@/lib/health/services/radiology.service";

export function useRadiologyReports(filter: string) {
  return usePaginatedQuery(["radiology-reports", filter], (range) => getRadiologyReports(filter, range));
}

export function useCreateRadiologyReport() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createRadiologyReport, onSuccess: () => qc.invalidateQueries({ queryKey: ["radiology-reports"] }) });
}

export function useRadiologyRequests(filter: string) {
  return usePaginatedQuery(["radiology-requests", filter], (range) => getRadiologyRequests(filter, range));
}

export function useCreateRadiologyRequest() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createRadiologyRequest, onSuccess: () => qc.invalidateQueries({ queryKey: ["radiology-requests"] }) });
}
