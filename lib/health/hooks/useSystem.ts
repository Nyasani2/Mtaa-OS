import { usePaginatedQuery } from "./usePaginatedQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuditLogs, getSystemRoles, createSystemRole, deleteSystemRole } from "@/lib/health/services/system.service";

export function useSystemAudit(filter: string) {
  return usePaginatedQuery(["system-audit", filter], (range) => getAuditLogs(filter, range));
}

export function useSystemRoles() {
  return usePaginatedQuery(["system-roles"], (range) => getSystemRoles(range));
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createSystemRole, onSuccess: () => qc.invalidateQueries({ queryKey: ["system-roles"] }) });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deleteSystemRole, onSuccess: () => qc.invalidateQueries({ queryKey: ["system-roles"] }) });
}
