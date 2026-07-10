import { supabase } from "../../supabase";

export async function getPendingFreightQueue() {
  const { data, error } = await supabase
    .from("freight_requests")
    .select("*")
    .eq("status", "PENDING")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data || [];
}

export async function markAssigned(request_id: string, truck_id: string) {
  await supabase
    .from("freight_requests")
    .update({ status: "ASSIGNED", truck_id })
    .eq("id", request_id);
}
