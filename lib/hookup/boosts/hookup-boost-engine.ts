import { supabase } from "../../supabase";

export async function activateBoost(
  user_id: string,
  boost_type: "PROFILE" | "MATCH" | "ROOM",
  duration: number
) {

  const cost = duration * 0.5;

  const { data, error } =
    await supabase
      .from("hookup_boost_purchases")
      .insert({
        user_id,
        boost_type,
        duration_minutes: duration,
        cost,
      })
      .select()
      .maybeSingle();

  if (error) throw error;

  return data;
}

export function calculateBoostEffect(
  base_score: number,
  boost_active: boolean
) {

  if (!boost_active) return base_score;

  return Math.min(
    100,
    base_score + 25
  );
}
