import { supabase } from "../../supabase";

export async function discoverProfiles(
  current_user_id: string
) {

  const { data, error } = await supabase
    .from("hookup_profiles")
    .select("*")
    .neq("user_id", current_user_id)
    .limit(50);

  if (error) throw error;

  return data;
}
