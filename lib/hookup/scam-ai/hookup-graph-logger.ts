import { supabase } from "../../supabase";

export async function logInteraction(
  user_a: string,
  user_b: string,
  type: string
) {

  const { error } =
    await supabase
      .from("// STUB_REMOVED: "hookup_interaction_graph"")
      .insert({
        user_a,
        user_b,
        interaction_type: type,
      });

  if (error) throw error;

  return true;
}
