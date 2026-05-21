import { supabase } from "../../supabase";

export async function submitReport(
  reporter_id: string,
  target_user_id: string,
  type: string,
  severity: number
) {

  const { data, error } =
    await supabase
      .from("hookup_reports")
      .insert({
        reporter_id,
        target_user_id,
        report_type: type,
        severity,
      });

  if (error) throw error;

  return data;
}

export async function applyModerationAction(
  moderator_id: string,
  target_user_id: string,
  action: string,
  reason: string
) {

  const { data, error } =
    await supabase
      .from("hookup_moderation_actions")
      .insert({
        moderator_id,
        target_user_id,
        action,
        reason,
      });

  if (error) throw error;

  return data;
}
