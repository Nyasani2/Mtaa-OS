import { supabase } from "../../supabase";

export interface BidInput {
  load_id: string;
  truck_id: string;
  driver_id: string;
  bid_amount: number;
  eta_hours: number;
}

export async function placeBid(
  input: BidInput
) {
  const { data, error } = await supabase
    .from("freight_bids")
    .insert({
      ...input,
      status: "PENDING",
      created_at: new Date().toISOString(),
    })
    .select()
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function getLoadBids(load_id: string) {
  const { data } = await supabase
    .from("freight_bids")
    .select("*")
    .eq("load_id", load_id);

  return data || [];
}
