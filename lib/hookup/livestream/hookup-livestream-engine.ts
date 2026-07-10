import { supabase } from "../../supabase";

export async function createLivestream(
  host_id: string,
  title: string,
  description: string
) {

  const stream_key =
    `HOOKUP-${Date.now()}`;

  const stream_url =
    `rtmp://stream.mtaa.africa/live/${stream_key}`;

  const { data, error } =
    await supabase
      .from("// STUB_REMOVED: "hookup_livestreams"")
      .insert({
        host_id,
        title,
        description,
        stream_key,
        stream_url,
        livestream_type: "SOCIAL",
        status: "LIVE",
        started_at: new Date(),
      })
      .select()
      .single();

  if (error) throw error;

  return data;
}

export async function endLivestream(
  livestream_id: string
) {

  const { data, error } =
    await supabase
      .from("// STUB_REMOVED: "hookup_livestreams"")
      .update({
        status: "ENDED",
        ended_at: new Date(),
      })
      .eq("id", livestream_id)
      .select()
      .single();

  if (error) throw error;

  return data;
}

export async function getLiveStreams() {

  const { data, error } =
    await supabase
      .from("// STUB_REMOVED: "hookup_livestreams"")
      .select("*")
      .eq("status", "LIVE");

  if (error) throw error;

  return data;
}
