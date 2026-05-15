import { supabase } from "../../supabase";

export type SignalType =
  | "OFFER"
  | "ANSWER"
  | "ICE_CANDIDATE"
  | "JOIN"
  | "LEAVE";

export async function sendSignal(
  room_id: string,
  user_id: string,
  type: SignalType,
  payload: any
) {

  const { error } = await supabase
    .from("hookup_room_signals")
    .insert({
      room_id,
      user_id,
      type,
      payload,
    });

  if (error) throw error;

  return true;
}

export function subscribeToSignals(
  room_id: string,
  callback: (signal: any) => void
) {

  return supabase
    .channel(`room-signal-${room_id}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "hookup_room_signals",
        filter: `room_id=eq.${room_id}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
}
