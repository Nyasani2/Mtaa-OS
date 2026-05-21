import { supabase } from "@/lib/supabase";
import type { Listing, Order, Escrow, TrustScore } from "@/lib/marketplace/types";

export async function getListings(filter?: { category?: string; location?: string; maxPrice?: number }): Promise<Listing[]> {
  let query = supabase.from("marketplace_listings").select("*").eq("status", "active").order("created_at", { ascending: false });
  if (filter?.category) query = query.eq("category", filter.category);
  if (filter?.location) query = query.ilike("location", `%${filter.location}%`);
  if (filter?.maxPrice) query = query.lte("price", filter.maxPrice);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getMyOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase.from("marketplace_orders").select("*").or(`buyer_id.eq.${userId},seller_id.eq.${userId}`).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getEscrow(orderId: string): Promise<Escrow | null> {
  const { data, error } = await supabase.from("marketplace_escrow").select("*").eq("order_id", orderId).single();
  if (error) throw error;
  return data;
}

export async function getTrustScore(userId: string): Promise<TrustScore | null> {
  const { data, error } = await supabase.from("marketplace_trust").select("*").eq("user_id", userId).single();
  if (error) throw error;
  return data;
}

export async function createListing(listing: Partial<Listing>): Promise<void> {
  const { error } = await supabase.from("marketplace_listings").insert({
    ...listing,
    status: "active",
    views: 0,
    inquiries: 0,
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function placeOrder(order: Partial<Order>): Promise<void> {
  const { error } = await supabase.from("marketplace_orders").insert({
    ...order,
    status: "pending",
    escrow_status: "held",
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
}
