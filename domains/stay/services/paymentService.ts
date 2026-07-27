// MTAA STAY OS — PAYMENT SERVICE
// Integrates with MTAA Wallet

import { supabase } from "@/lib/supabase";
import type { StayPayment } from "../types";

export class PaymentService {
  async createPayment(payment: Partial<StayPayment>): Promise<StayPayment> {
    const { data: receiptNum } = await supabase.rpc("generate_receipt_number");

    const { data, error } = await supabase
      .from("property_payments")
      .insert({ ...payment, receipt_number: receiptNum })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getPaymentById(id: string): Promise<StayPayment | null> {
    const { data, error } = await supabase
      .from("property_payments")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  async getUserPayments(userId: string): Promise<StayPayment[]> {
    const { data, error } = await supabase
      .from("property_payments")
      .select("*")
      .or(`payer_id.eq.${userId},payee_id.eq.${userId}`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getPropertyPayments(propertyId: string): Promise<StayPayment[]> {
    const { data, error } = await supabase
      .from("property_payments")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async generateReceipt(paymentId: string): Promise<string> {
    const { data, error } = await supabase
      .from("property_payments")
      .update({ receipt_url: `/receipts/${paymentId}.pdf` })
      .eq("id", paymentId)
      .select("receipt_url")
      .single();
    if (error) throw error;
    return data.receipt_url;
  }
}

export const paymentService = new PaymentService();
