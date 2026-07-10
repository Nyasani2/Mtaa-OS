import { supabase } from "../../supabase";

export async function createGroup(
  owner_id: string,
  name: string,
  description: string,
  category: string
) {

  const { data, error } =
    await supabase
      .from("hookup_groups")
      .insert({
        owner_id,
        name,
        description,
        category,
      })
      .select()
      .single();

  if (error) throw error;

  return data;
}

export async function joinGroup(
  group_id: string,
  user_id: string
) {

  const { data, error } =
    await supabase
      .from("// STUB_REMOVED: "hookup_group_members"")
      .insert({
        group_id,
        user_id,
      })
      .select()
      .single();

  if (error) throw error;

  return data;
}

export async function getGroups() {

  const { data, error } =
    await supabase
      .from("hookup_groups")
      .select("*")
      .order("member_count", {
        ascending: false,
      });

  if (error) throw error;

  return data;
}
