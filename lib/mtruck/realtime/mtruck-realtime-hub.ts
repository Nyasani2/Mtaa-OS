import { supabase } from "../../supabase";

type ChannelEvent =
  | "fleet:update"
  | "dispatch:update"
  | "traffic:update"
  | "ai:decision";

export interface RealtimePayload {
  type: ChannelEvent;
  data: any;
  timestamp: string;
}

export class MTruckRealtimeHub {

  private channel;

  constructor() {

    this.channel = supabase
      .channel("mtruck-realtime");
  }

  subscribe(callback: (payload: RealtimePayload) => void) {

    this.channel
      .on(
        "broadcast",
        { event: "*" },
        (payload) => {
          callback(payload.payload);
        }
      )
      .subscribe();

    return this;
  }

  emit(event: ChannelEvent, data: any) {

    const payload: RealtimePayload = {
      type: event,
      data,
      timestamp: new Date().toISOString(),
    };

    this.channel.send({
      type: "broadcast",
      event,
      payload,
    });

    return payload;
  }
}
