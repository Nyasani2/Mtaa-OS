import { supabase } from "../../supabase";

export async function createRoom(
  host_id: string,
  room_type: "VOICE" | "VIDEO" | "PRIVATE" | "GROUP",
  title: string,
  is_private: boolean = false
) {

  const access_code =
    is_private
      ? Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase()
      : null;

  const { data, error } =
    await supabase
      .from("hookup_rooms")
      .insert({
        host_id,
        room_type,
        title,
        is_private,
        access_code,
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
      .from(
        "hookup_room_participants"
      )
      .insert({
        room_id,
        user_id,
      })
      .select()
      .single();

  if (error) throw error;

  await supabase
    .rpc("increment_room_count", {
      room_id_input: room_id,
    });

  return data;
}

export async function getActiveRooms() {

  const { data, error } =
    await supabase
      .from("hookup_rooms")
      .select("*")
      .eq("status", "ACTIVE");

  if (error) throw error;

  return data;
}
