import { supabase } from "../../supabase";

export async function updateFraudScore(
  user_id: string,
  delta: number
) {

  const { data } =
    await supabase
      .from("hookup_fraud_scores")
      .select("*")
      .eq("user_id", user_id)
      .single();

  const current =
    data?.fraud_risk_score || 0;

  const newScore =
    Math.min(
      100,
      current + delta
    );

  const { error } =
    await supabase
      .from("hookup_fraud_scores")
      .upsert({
        user_id,
        fraud_risk_score: newScore,
        last_updated: new Date(),
      });

  if (error) throw error;

  return newScore;
}
