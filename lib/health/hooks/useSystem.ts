import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuditLogs, getSystemRoles, createSystemRole, deleteSystemRole } from "@/lib/health/services/system.service";

export function useSystemAudit(filter: string) {
  return useQuery({ queryKey: ["system-audit", filter], queryFn: () => getAuditLogs(filter) });
}
export function useSystemRoles() {
  return useQuery({ queryKey: ["system-roles"], queryFn: getSystemRoles });
}
export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createSystemRole, onSuccess: () => qc.invalidateQueries({ queryKey: ["system-roles"] }) });
}
export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deleteSystemRole, onSuccess: () => qc.invalidateQueries({ queryKey: ["system-roles"] }) });
}
