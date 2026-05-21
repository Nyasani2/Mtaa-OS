import { supabase } from "../../supabase";

export async function updatePresence(
  user_id: string,
  lat: number,
  lng: number,
  activity: string
) {

  const { data, error } =
    await supabase
      .from("hookup_live_presence")
      .upsert({
        user_id,
        latitude: lat,
        longitude: lng,
        activity_type: activity,
        last_seen: new Date(),
      });

  if (error) throw error;

  return data;
}
