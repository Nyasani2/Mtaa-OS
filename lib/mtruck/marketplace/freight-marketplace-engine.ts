import { supabase } from "../../supabase";

export interface FreightListing {
  customer_id: string;

  title: string;

  cargo_type: string;

  pickup_location: string;

  dropoff_location: string;

  weight_kg: number;

  budget_amount: number;
}

export async function createFreightListing(
  listing: FreightListing
) {

  const { data, error } = await supabase
    .from("mtruck_marketplace")
    .insert({
      customer_id: listing.customer_id,
      title: listing.title,
      cargo_type: listing.cargo_type,
      pickup_location:
        listing.pickup_location,
      dropoff_location:
        listing.dropoff_location,
      weight_kg: listing.weight_kg,
      budget_amount:
        listing.budget_amount,
      status: "OPEN",
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getOpenFreightListings() {

  const { data, error } = await supabase
    .from("mtruck_marketplace")
    .select("*")
    .eq("status", "OPEN")
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return data || [];
}
