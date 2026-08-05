import { supabase } from "../../supabase";

export async function getTrustScore(
  user_id: string
) {

  const { data, error } =
    await supabase
      .from("hookup_trust_scores")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

  if (error) throw error;

  return data;
}

export async function updateTrustScore(
  user_id: string,
  delta: number
) {

  const current =
    await getTrustScore(user_id);

  const newScore =
    Math.max(
      0,
      Math.min(
        100,
        current.trust_score + delta
      )
    );

  const { data, error } =
    await supabase
      .from("hookup_trust_scores")
      .update({
        trust_score: newScore,
        last_updated: new Date(),
      })
      .eq("user_id", user_id)
      .select()
      .maybeSingle();

  if (error) throw error;

  return data;
}
