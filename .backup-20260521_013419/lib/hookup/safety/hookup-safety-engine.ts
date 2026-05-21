import { supabase } from "../../supabase";

export async function reportUser(
  reporter_id: string,
  target_user_id: string,
  reason: string,
  details?: string
) {

  const { data, error } =
    await supabase
      .from("hookup_reports")
      .insert({
        reporter_id,
        target_user_id,
        reason,
        details,
      })
      .select()
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function blockUser(
  blocker_id: string,
  blocked_id: string
) {

  const { data, error } =
    await supabase
      .from("hookup_blocks")
      .insert({
        blocker_id,
        blocked_id,
      })
      .select()
      .single();

  if (error) {
    throw error;
  }

  return data;
}
