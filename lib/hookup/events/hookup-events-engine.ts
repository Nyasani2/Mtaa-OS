import { supabase } from "../../supabase";

export async function createEvent(
  creator_id: string,
  title: string,
  description: string,
  city: string
) {

  const { data, error } =
    await supabase
      .from("hookup_events")
      .insert({
        creator_id,
        title,
        description,
        city,
      })
      .select()
      .single();

  if (error) throw error;

  return data;
}

export async function joinEvent(
  event_id: string,
  user_id: string
) {

  const { data, error } =
    await supabase
      .from("hookup_event_attendees")
      .insert({
        event_id,
        user_id,
      })
      .select()
      .single();

  if (error) throw error;

  return data;
}

export async function getEvents() {

  const { data, error } =
    await supabase
      .from("hookup_events")
      .select("*")
      .order("starts_at", {
        ascending: true,
      });

  if (error) throw error;

  return data;
}
