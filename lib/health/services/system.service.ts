import { supabase } from "@/lib/supabase/client";

export async function getAuditLogs(filter: string) {
  let q = supabase.from("health_audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
  if (filter !== "all") q = q.eq("action", filter);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getSystemRoles() {
  const { data, error } = await supabase.from("health_roles").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
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
