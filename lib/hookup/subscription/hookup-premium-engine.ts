import { supabase } from "../../supabase";

export async function activatePremium(
  user_id: string,
  tier:
    | "GOLD"
    | "PLATINUM"
    | "ROYAL"
) {

  const expires =
    new Date();

  expires.setMonth(
    expires.getMonth() + 1
  );

  const { data, error } =
    await supabase
      .from("hookup_subscriptions")
      .insert({
        user_id,
        tier,
        expires_at: expires,
      })
      .select()
      .maybeSingle();

  if (error) throw error;

  await supabase
    .from("hookup_profiles")
    .update({
      premium_tier: tier,
    })
    .eq("user_id", user_id);

  return data;
}
