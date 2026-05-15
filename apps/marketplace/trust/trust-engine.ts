import { supabase } from "../../../supabase";

/**
 * TRUST ENGINE
 * Marketplace reputation system
 */

export async function getSellerTrustScore(seller_id: string) {
  const { data: reviews } = await supabase
    .from("marketplace_reviews")
    .select("rating")
    .eq("seller_id", seller_id);

  if (!reviews || reviews.length === 0) return 4.0;

  const avg =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return avg;
}
