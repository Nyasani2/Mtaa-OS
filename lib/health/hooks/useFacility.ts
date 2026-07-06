import { usePaginatedQuery } from "./usePaginatedQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getFacilities, createFacility } from "@/lib/health/services/facility.service";

export function useFacilities(filter: string) {
  return usePaginatedQuery(["facilities", filter], (range) => getFacilities(filter, range));
}

export function useCreateFacility() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createFacility, onSuccess: () => qc.invalidateQueries({ queryKey: ["facilities"] }) });
}
