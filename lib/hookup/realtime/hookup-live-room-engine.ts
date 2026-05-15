import { supabase } from "../../supabase";

export async function createLiveRoom(
  host_id: string,
  type: "VOICE" | "VIDEO",
  is_private: boolean
) {

  const { data, error } =
    await supabase
      .from("hookup_live_rooms")
      .insert({
        host_id,
        room_type: type,
        is_private,
        status: "ACTIVE",
      })
      .select()
      .single();

  if (error) throw error;

  return data;
}

export async function joinRoom(
  room_id: string,
  user_id: string
) {

  const { data, error } =
    await supabase
      .from("hookup_live_participants")
      .insert({
        room_id,
        user_id,
        role: "LISTENER",
      });

  if (error) throw error;

  return data;
}
