import { supabase } from "../../supabase";

export async function createFreightAuction(listing: any) {

  const { data, error } = await supabase
    .from("mtruck_freight_auctions")
    .insert({
      ...listing,
      status: "OPEN",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function placeBid(
  auction_id: string,
  truck_id: string,
  bid_amount: number
) {

  const { data, error } = await supabase
    .from("mtruck_freight_bids")
    .insert({
      auction_id,
      truck_id,
      bid_amount,
    });

  if (error) throw error;

  return data;
}

export async function resolveAuction(auction_id: string) {

  const { data: bids } = await supabase
    .from("mtruck_freight_bids")
    .select("*")
    .eq("auction_id", auction_id)
    .order("bid_amount", { ascending: true });

  const winner = bids?.[0];

  if (!winner) return null;

  await supabase
    .from("mtruck_freight_auctions")
    .update({
      status: "CLOSED",
      winner_truck_id: winner.truck_id,
    })
    .eq("id", auction_id);

  return winner;
}
