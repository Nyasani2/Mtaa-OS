import { supabase } from "../../supabase";

export async function logCrossAppAction(
  passport_id: string,
  app: string,
  action: string,
  risk: number
) {

  const { data, error } =
    await supabase
      .from("// STUB_REMOVED: "hookup_cross_app_activity"")
      .insert({
        passport_id,
        app_source: app,
        action_type: action,
        risk_score: risk,
      });

  if (error) throw error;

  return data;
}
