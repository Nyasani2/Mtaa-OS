import { supabase } from "../../supabase";

export async function acceptBid(
  load_id: string,
  bid_id: string
) {
  const { data: bid } = await supabase
    .from("freight_bids")
    .select("*")
    .eq("id", bid_id)
    .maybeSingle();

  if (!bid) {
    throw new Error("Bid not found");
  }

  await supabase
    .from("freight_marketplace")
    .update({
      status: "MATCHED",
      accepted_bid_id: bid_id,
    })
    .eq("id", load_id);

  await supabase
    .from("freight_contracts")
    .insert({
      load_id,
      bid_id,
      truck_id: bid.truck_id,
      driver_id: bid.driver_id,
      amount: bid.bid_amount,
      status: "ACTIVE",
      created_at: new Date().toISOString(),
    });

  return {
    status: "contract_created",
  };
}
