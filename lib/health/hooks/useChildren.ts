import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChildrenRecords, createChildRecord } from "@/lib/health/services/children.service";

export function useChildrenRecords(filter: string) {
  return useQuery({ queryKey: ["children-records", filter], queryFn: () => getChildrenRecords(filter) });
}
export function useCreateChildRecord() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createChildRecord, onSuccess: () => qc.invalidateQueries({ queryKey: ["children-records"] }) });
}
