import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRadiologyReports, createRadiologyReport, getRadiologyRequests, createRadiologyRequest } from "@/lib/health/services/radiology.service";

export function useRadiologyReports(filter: string) {
  return useQuery({ queryKey: ["radiology-reports", filter], queryFn: () => getRadiologyReports(filter) });
}
export function useCreateRadiologyReport() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createRadiologyReport, onSuccess: () => qc.invalidateQueries({ queryKey: ["radiology-reports"] }) });
}
export function useRadiologyRequests(filter: string) {
  return useQuery({ queryKey: ["radiology-requests", filter], queryFn: () => getRadiologyRequests(filter) });
}
export function useCreateRadiologyRequest() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createRadiologyRequest, onSuccess: () => qc.invalidateQueries({ queryKey: ["radiology-requests"] }) });
}
