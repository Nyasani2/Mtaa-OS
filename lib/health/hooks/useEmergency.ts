import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEmergencyCases, createEmergencyCase } from "@/lib/health/services/emergency.service";

export function useEmergencyCases(filter: string) {
  return useQuery({ queryKey: ["emergency-cases", filter], queryFn: () => getEmergencyCases(filter) });
}
export function useCreateEmergencyCase() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createEmergencyCase, onSuccess: () => qc.invalidateQueries({ queryKey: ["emergency-cases"] }) });
}
