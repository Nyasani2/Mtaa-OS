import { supabase } from "../../../supabase";

/**
 * ORDER ENGINE
 * Connects marketplace → MTAXI / MTRUCK delivery systems
 */

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;

  quantity: number;
  total_price: number;

  delivery_type: "MTAXI" | "MTRUCK";

  status: "PENDING" | "PAID" | "DELIVERING" | "COMPLETED";
}

/**
 * Create order
 */
export async function createOrder(order: Omit<Order, "id">) {
  const { data, error } = await supabase
    .from("marketplace_orders")
    .insert(order)
    .select()
    .single();

  if (error) throw new Error("Order creation failed");

  return data;
}

/**
 * Route delivery automatically
 */
export async function routeDelivery(order: Order) {
  if (order.delivery_type === "MTAXI") {
    return {
      route: "mtaxi_dispatch",
      priority: "FAST",
    };
  }

  return {
    route: "mtruck_dispatch",
    priority: "HEAVY_LOAD",
  };
}
