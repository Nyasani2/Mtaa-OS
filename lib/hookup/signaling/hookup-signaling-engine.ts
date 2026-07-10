import { supabase } from "../../supabase";

export type SignalType =
  | "OFFER"
  | "ANSWER"
  | "ICE_CANDIDATE"
  | "JOIN"
  | "LEAVE";

export class HookupSignalingEngine {
  roomId: string;
  userId: string;

  constructor(roomId: string, userId: string) {
    this.roomId = roomId;
    this.userId = userId;
  }

  async connect() {
    return true;
  }

  async disconnect() {
    return true;
  }

  async reconnect() {
    return true;
  }

  async createOffer(payload: any = {}) {
    const { error } = await supabase
      .from("hookup_room_signals")
      .insert({
        room_id: this.roomId,
        user_id: this.userId,
        type: "OFFER",
        payload,
      });

    if (error) throw error;

    return true;
  }

  subscribe(callback: (signal: any) => void) {
    return supabase
      .channel(`room-signal-${this.roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "hookup_room_signals",
          filter: `room_id=eq.${this.roomId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();
  }
}
