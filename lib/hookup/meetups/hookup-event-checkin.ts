import { supabase } from "../../supabase";

export async function checkInUser(
  event_id: string,
  user_id: string
) {

  const { data, error } =
    await supabase
      .from("hookup_event_participants")
      .update({
        status: "CHECKED_IN",
        checkin_time: new Date(),
      })
      .eq("event_id", event_id)
      .eq("user_id", user_id);

  if (error) throw error;

  return data;
}
