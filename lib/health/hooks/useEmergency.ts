import { usePaginatedQuery } from "./usePaginatedQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getEmergencyCases, createEmergencyCase } from "@/lib/health/services/emergency.service";

export function useEmergencyCases(filter: string) {
  return usePaginatedQuery(["emergency-cases", filter], (range) => getEmergencyCases(filter, range));
}

export function useCreateEmergencyCase() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createEmergencyCase, onSuccess: () => qc.invalidateQueries({ queryKey: ["emergency-cases"] }) });
}
