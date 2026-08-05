import { supabase } from "../../supabase";

export async function createEvent(
  host_id: string,
  data: any
) {

  const { data: event, error } =
    await supabase
      .from("hookup_events")
      .insert({
        host_id,
        title: data.title,
        description: data.description,
        event_type: data.type,
        location_lat: data.lat,
        location_lng: data.lng,
        start_time: data.start,
        end_time: data.end,
        safety_level: data.safety_level,
      })
      .select()
      .maybeSingle();

  if (error) throw error;

  return event;
}
