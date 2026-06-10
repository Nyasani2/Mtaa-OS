// MTAA PROPERTY OS — MAINTENANCE SERVICE

import { supabase } from "@/lib/supabase";
import type { MaintenanceTicket } from "../types";

export class MaintenanceService {
  async createTicket(ticket: Partial<MaintenanceTicket>): Promise<MaintenanceTicket> {
    const { data, error } = await supabase
      .from("maintenance_tickets")
      .insert(ticket)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getTicketById(id: string): Promise<MaintenanceTicket | null> {
    const { data, error } = await supabase
      .from("maintenance_tickets")
      .select("*, property:properties(title), tenant:profiles!tenant_id(full_name), contractor:profiles!contractor_id(full_name)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  async getTenantTickets(tenantId: string): Promise<MaintenanceTicket[]> {
    const { data, error } = await supabase
      .from("maintenance_tickets")
      .select("*, property:properties(title)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getLandlordTickets(landlordId: string): Promise<MaintenanceTicket[]> {
    const { data, error } = await supabase
      .from("maintenance_tickets")
      .select("*, property:properties(title), tenant:profiles!tenant_id(full_name)")
      .eq("landlord_id", landlordId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async assignContractor(ticketId: string, contractorId: string): Promise<void> {
    const { error } = await supabase
      .from("maintenance_tickets")
      .update({ contractor_id: contractorId, status: "assigned", assigned_at: new Date().toISOString() })
      .eq("id", ticketId);
    if (error) throw error;
  }

  async updateStatus(ticketId: string, status: string): Promise<void> {
    const updates: any = { status };
    if (status === "completed") updates.completed_at = new Date().toISOString();
    const { error } = await supabase.from("maintenance_tickets").update(updates).eq("id", ticketId);
    if (error) throw error;
  }

  async approveCompletion(ticketId: string, landlordId: string): Promise<void> {
    const { error } = await supabase
      .from("maintenance_tickets")
      .update({ status: "landlord_approval", approved_by_landlord_at: new Date().toISOString() })
      .eq("id", ticketId);
    if (error) throw error;
  }

  async approvePayment(ticketId: string, walletTransactionId: string): Promise<void> {
    const { error } = await supabase
      .from("maintenance_tickets")
      .update({ status: "paid", wallet_transaction_id: walletTransactionId })
      .eq("id", ticketId);
    if (error) throw error;
  }
}

export const maintenanceService = new MaintenanceService();
