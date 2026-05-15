import { supabase } from "../../supabase";

export async function logAdImpression(
  user_id: string,
  ad_type: string,
  revenue: number
) {

  const { data, error } =
    await supabase
      .from("hookup_ads_impressions")
      .insert({
        user_id,
        ad_type,
        revenue,
      });

  if (error) throw error;

  return data;
}

export function estimateRevenue(
  impressions: number
) {

  const cpm = 2.5; // example CPM model

  return (impressions / 1000) * cpm;
}
