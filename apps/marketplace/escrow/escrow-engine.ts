import { supabase } from "../../../supabase";

/**
 * ESCROW ENGINE
 * Holds funds until delivery confirmation
 */

export interface Escrow {
  id: string;
  order_id: string;

  buyer_id: string;
  seller_id: string;

  amount: number;
  status: "HELD" | "RELEASED" | "DISPUTED";

  created_at: string;
}

/**
 * Create escrow on purchase
 */
export async function createEscrow(order: any, amount: number) {
  const { data, error } = await supabase
    .from("marketplace_escrow")
    .insert({
      order_id: order.id,
      buyer_id: order.buyer_id,
      seller_id: order.seller_id,
      amount,
      status: "HELD",
    })
    .select()
    .single();

  if (error) throw new Error("Escrow creation failed");

  return data;
}

/**
 * Release funds to seller
 */
export async function releaseEscrow(escrow_id: string) {
  const { data } = await supabase
    .from("marketplace_escrow")
    .update({ status: "RELEASED" })
    .eq("id", escrow_id)
    .select()
    .single();

  return data;
}
