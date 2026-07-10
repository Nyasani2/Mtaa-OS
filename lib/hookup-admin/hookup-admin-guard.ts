import { supabase } from "@/lib/supabase";

export async function isHookupAdmin(
  user_id: string
) {

  const { data, error } =
    await supabase
      .from("// STUB_REMOVED: "hookup_moderators"")
      .select("role")
      .eq("user_id", user_id)
      .single();

  if (error || !data) {
    return false;
  }

  return [
    "SUPER_MOD",
    "AI_MOD"
  ].includes(data.role);
}
