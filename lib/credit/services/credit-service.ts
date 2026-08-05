import { supabase } from "@/lib/supabase";
import type { CreditProfile, Loan, Investment, Transaction } from "@/lib/credit/types";

export async function getCreditProfile(userId: string): Promise<CreditProfile | null> {
  const { data, error } = await supabase.from("credit_profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getLoans(userId: string): Promise<Loan[]> {
  const { data, error } = await supabase.from("loans").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getInvestments(userId: string): Promise<Investment[]> {
  const { data, error } = await supabase.from("investments").select("*").eq("user_id", userId);
  if (error) throw error;
  return data || [];
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase.from("credit_transactions").select("*").eq("user_id", userId).order("timestamp", { ascending: false }).limit(50);
  if (error) throw error;
  return data || [];
}

export async function applyForLoan(userId: string, principal: number, termMonths: number, purpose: string): Promise<void> {
  const { error } = await supabase.from("loans").insert({
    user_id: userId,
    principal,
    interest_rate: 12.5,
    term_months: termMonths,
    monthly_payment: Math.round((principal * 1.125) / termMonths),
    remaining_balance: principal * 1.125,
    status: "pending",
    purpose,
    next_due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });
  if (error) throw error;
}
