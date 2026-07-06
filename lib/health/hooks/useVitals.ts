import { usePaginatedQuery } from "./usePaginatedQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getVitalsRecords, createVitalsRecord } from "@/lib/health/services/vitals.service";

export function useVitalsRecords(filter: string) {
  return usePaginatedQuery(["vitals-records", filter], (range) => getVitalsRecords(filter, range));
}

export function useCreateVitalsRecord() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createVitalsRecord, onSuccess: () => qc.invalidateQueries({ queryKey: ["vitals-records"] }) });
}
