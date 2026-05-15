import { supabase } from "../../../supabase";

/**
 * STREET FEED
 * Live urban activity stream (TikTok-style city layer)
 */

export async function getStreetFeed() {
  const { data } = await supabase
    .from("street_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return data || [];
}

export async function publishStreetEvent(event: any) {
  const { error } = await supabase.from("street_events").insert({
    ...event,
    created_at: new Date().toISOString(),
  });

  if (error) throw new Error("Failed to publish street event");
}
