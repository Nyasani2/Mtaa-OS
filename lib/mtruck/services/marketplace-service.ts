import { supabase } from "@/lib/supabase";
import type { FreightListing } from "@/lib/mtruck/types";

export async function getListings(): Promise<FreightListing[]> {
  const { data, error } = await supabase.from("mtruck_listings").select("*").gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function placeBid(listingId: string, amount: number): Promise<void> {
  const { error } = await supabase.from("mtruck_bids").insert({ listing_id: listingId, amount, status: "pending" });
  if (error) throw error;
}
