// MTAA PROPERTY OS — LEASE SERVICE

import { supabase } from "@/lib/supabase";
import type { Lease } from "../types";

export class LeaseService {
  async createLease(lease: Partial<Lease>): Promise<Lease> {
    const { data, error } = await supabase
      .from("leases")
      .insert(lease)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getLeaseById(id: string): Promise<Lease | null> {
    const { data, error } = await supabase
      .from("leases")
      .select("*, property:properties(*), tenant:profiles!tenant_id(*), landlord:profiles!landlord_id(*)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  async getTenantLeases(tenantId: string): Promise<Lease[]> {
    const { data, error } = await supabase
      .from("leases")
      .select("*, property:properties(title, cover_image)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getLandlordLeases(landlordId: string): Promise<Lease[]> {
    const { data, error } = await supabase
      .from("leases")
      .select("*, property:properties(title), tenant:profiles!tenant_id(full_name, avatar_url)")
      .eq("landlord_id", landlordId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async signLease(id: string, role: "tenant" | "landlord"): Promise<void> {
    const update = role === "tenant"
      ? { signed_by_tenant_at: new Date().toISOString() }
      : { signed_by_landlord_at: new Date().toISOString() };
    const { error } = await supabase.from("leases").update(update).eq("id", id);
    if (error) throw error;
  }

  async terminateLease(id: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from("leases")
      .update({ status: "terminated", termination_reason: reason, terminated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }

  async renewLease(id: string, newEndDate: string): Promise<Lease> {
    const { data: oldLease } = await supabase.from("leases").select("*").eq("id", id).single();
    if (!oldLease) throw new Error("Lease not found");

    const { data, error } = await supabase
      .from("leases")
      .insert({
        ...oldLease,
        id: undefined,
        start_date: oldLease.end_date,
        end_date: newEndDate,
        status: "active",
        renewed_from_lease_id: id,
        created_at: undefined,
        updated_at: undefined,
      })
      .select()
      .single();
    if (error) throw error;

    await supabase.from("leases").update({ status: "renewed" }).eq("id", id);
    return data;
  }
}

export const leaseService = new LeaseService();
