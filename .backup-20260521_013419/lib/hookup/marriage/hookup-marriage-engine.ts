import { supabase } from "../../supabase";

export async function proposeMarriageMode(
  user_id: string,
  target_user_id: string
) {

  const { data, error } =
    await supabase
      .from("hookup_marriage_proposals")
      .insert({
        proposer_id: user_id,
        receiver_id: target_user_id,
        status: "PENDING",
      });

  if (error) throw error;

  return data;
}

export async function acceptMarriageMode(
  proposal_id: string
) {

  const { data, error } =
    await supabase
      .from("hookup_marriage_proposals")
      .update({
        status: "ACCEPTED",
        accepted_at: new Date(),
      })
      .eq("id", proposal_id)
      .select()
      .single();

  if (error) throw error;

  return data;
}
