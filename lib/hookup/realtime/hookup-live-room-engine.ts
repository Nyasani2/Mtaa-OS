import { supabase } from "../../supabase";

export class HookupLiveRoomEngine {
  roomId: string;
  userId: string;

  constructor(roomId: string, userId: string) {
    this.roomId = roomId;
    this.userId = userId;
  }

  async join() {
    const { data, error } =
      await supabase
        .from("hookup_live_participants")
        .insert({
          room_id: this.roomId,
          user_id: this.userId,
          role: "LISTENER",
        });

    if (error) {
      throw error;
    }

    return data;
  }

  async rejoin() {
    return this.join();
  }

  async leave() {
    return true;
  }

  async createRoom(
    type: "VOICE" | "VIDEO" = "VIDEO",
    is_private: boolean = false
  ) {
    const { data, error } =
      await supabase
        .from("hookup_live_rooms")
        .insert({
          host_id: this.userId,
          room_type: type,
          is_private,
          status: "ACTIVE",
        })
        .select()
        .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }
}
