import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFacilities, createFacility } from "@/lib/health/services/facility.service";

export function useFacilities(filter: string) {
  return useQuery({ queryKey: ["facilities", filter], queryFn: () => getFacilities(filter) });
}
export function useCreateFacility() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createFacility, onSuccess: () => qc.invalidateQueries({ queryKey: ["facilities"] }) });
}
