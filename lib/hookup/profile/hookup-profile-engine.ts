import { supabase } from "../../supabase";

export interface HookupProfile {

  user_id: string;

  display_name: string;

  username: string;

  bio?: string;

  age?: number;

  gender?: string;

  country?: string;

  city?: string;

  languages?: string[];

  religion?: string;

  relationship_goal?: string;

  relationship_structure?: string;
}

export async function createHookupProfile(
  profile: HookupProfile
) {

  const { data, error } = await supabase
    .from("hookup_profiles")
    .insert(profile)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getHookupProfile(
  user_id: string
) {

  const { data, error } = await supabase
    .from("hookup_profiles")
    .select("*")
    .eq("user_id", user_id)
    .single();

  if (error) throw error;

  return data;
}

export async function updateHookupProfile(
  user_id: string,
  updates: Partial<HookupProfile>
) {

  const { data, error } = await supabase
    .from("hookup_profiles")
    .update(updates)
    .eq("user_id", user_id)
    .select()
    .single();

  if (error) throw error;

  return data;
}
