import { supabase } from "../../../supabase";

/**
 * MARKETPLACE LISTINGS ENGINE
 * Core product/service publishing system
 */

export interface Listing {
  id: string;
  seller_id: string;

  title: string;
  description: string;

  price: number;
  category: string;

  location_lat: number;
  location_lng: number;

  stock: number;
  is_active: boolean;

  created_at: string;
}

/**
 * Create listing
 */
export async function createListing(listing: Omit<Listing, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("marketplace_listings")
    .insert({
      ...listing,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error("Failed to create listing");

  return data;
}

/**
 * Fetch marketplace feed (city-aware ranking)
 */
export async function getMarketplaceFeed() {
  const { data } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return data || [];
}
