import { supabase } from "../../supabase";

export async function createPassport(
  user_id: string
) {

  const passport_id =
    `HP-${user_id.slice(0,8)}-${Date.now()}`;

  const { data, error } =
    await supabase
      .from("hookup_identity_passports")
      .insert({
        user_id,
        passport_id,
        verification_level: "BASIC",
        global_reputation_score: 50,
      })
      .select()
      .maybeSingle();

  if (error) throw error;

  return data;
}

export async function updateReputation(
  passport_id: string,
  delta: number
) {

  const { data } =
    await supabase
      .from("hookup_identity_passports")
      .select("*")
      .eq("passport_id", passport_id)
      .maybeSingle();

  const newScore =
    Math.max(
      0,
      Math.min(
        100,
        (data?.global_reputation_score || 50) +
          delta
      )
    );

  const { error } =
    await supabase
      .from("hookup_identity_passports")
      .update({
        global_reputation_score: newScore,
      })
      .eq("passport_id", passport_id);

  if (error) throw error;

  return newScore;
}
