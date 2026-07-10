import { usePaginatedQuery } from "./usePaginatedQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getPatients, getPolicies, createClaim, getClaims } from "@/lib/health/services/insurance.service";

export function useInsuranceClaims() {
  const patients = usePaginatedQuery(["insurance-patients"], (range) => getPatients(range));
  const policies = usePaginatedQuery(["insurance-policies"], (range) => getPolicies(range));
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: createClaim,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insurance-claims"] }),
  });
  return { patients, policies, createClaim: create };
}

export function useInsuranceRemaining(filter: string) {
  return usePaginatedQuery(["insurance-claims", filter], (range) => getClaims(filter, range));
}
