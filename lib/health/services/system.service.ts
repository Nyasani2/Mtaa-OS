import { supabase } from "@/lib/supabase";

export async function getAuditLogs(filter: string, range: { from: number; to: number }) {
  let q = supabase.from("health_audit_logs").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (filter !== "all") q = q.eq("action", filter);
  const { data, error, count } = await q.range(range.from, range.to);
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function getSystemRoles(range: { from: number; to: number }) {
  const { data, error, count } = await supabase
    .from("health_roles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: true })
    .range(range.from, range.to);
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function createSystemRole(payload: { name: string; permissions: string[] }) {
  const { data, error } = await supabase.from("health_roles").insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSystemRole(roleId: string) {
  const { error } = await supabase.from("health_roles").delete().eq("id", roleId);
  if (error) throw error;
}
