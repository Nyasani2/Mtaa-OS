import { supabase } from "@/lib/supabase/client";

export async function getInsuranceClaims(status: string, range: { from: number; to: number }) {
  let q = supabase.from("health_insurance_claims").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (status !== "all") q = q.eq("status", status);
  const { data, error, count } = await q.range(range.from, range.to);
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function approveClaim(claimId: string) {
  const { data, error } = await supabase.from("health_insurance_claims").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", claimId).select().single();
  if (error) throw error;
  return data;
}

export async function rejectClaim(claimId: string, reason: string) {
  const { data, error } = await supabase.from("health_insurance_claims").update({ status: "rejected", rejection_reason: reason }).eq("id", claimId).select().single();
  if (error) throw error;
  return data;
}

export async function getInvoices(status: string, range: { from: number; to: number }) {
  let q = supabase.from("health_invoices").select("*, items:health_invoice_items(*)", { count: "exact" }).order("created_at", { ascending: false });
  if (status !== "all") q = q.eq("status", status);
  const { data, error, count } = await q.range(range.from, range.to);
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function createInvoice(payload: any) {
  const { data, error } = await supabase.from("health_invoices").insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function getUnpaidInvoices(range: { from: number; to: number }) {
  const { data, error, count } = await supabase
    .from("health_invoices")
    .select("*", { count: "exact" })
    .neq("status", "paid")
    .order("created_at", { ascending: false })
    .range(range.from, range.to);
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function processPayment(payload: { invoice_id: string; amount: number; method: string; reference?: string; user_id?: string }) {
  // If wallet, this will be handled by wallet-health.service
  const { data, error } = await supabase.from("health_payments").insert([{
    invoice_id: payload.invoice_id,
    amount: payload.amount,
    method: payload.method,
    reference: payload.reference,
    status: "completed",
    processed_at: new Date().toISOString(),
  }]).select().single();
  if (error) throw error;

  // Update invoice status
  await supabase.from("health_invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", payload.invoice_id);

  return data;
}

export async function getPayments(method: string, range: { from: number; to: number }) {
  let q = supabase.from("health_payments").select("*", { count: "exact" }).order("processed_at", { ascending: false });
  if (method !== "all") q = q.eq("method", method);
  const { data, error, count } = await q.range(range.from, range.to);
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}
