import { usePaginatedQuery } from "./usePaginatedQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getChildrenRecords, createChildRecord } from "@/lib/health/services/children.service";

export function useChildrenRecords(filter: string) {
  return usePaginatedQuery(["children-records", filter], (range) => getChildrenRecords(filter, range));
}

export function useCreateChildRecord() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createChildRecord, onSuccess: () => qc.invalidateQueries({ queryKey: ["children-records"] }) });
}
