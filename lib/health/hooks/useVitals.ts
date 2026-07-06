import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVitalsRecords, createVitalsRecord } from "@/lib/health/services/vitals.service";

export function useVitalsRecords(filter: string) {
  return useQuery({ queryKey: ["vitals-records", filter], queryFn: () => getVitalsRecords(filter) });
}
export function useCreateVitalsRecord() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createVitalsRecord, onSuccess: () => qc.invalidateQueries({ queryKey: ["vitals-records"] }) });
}
