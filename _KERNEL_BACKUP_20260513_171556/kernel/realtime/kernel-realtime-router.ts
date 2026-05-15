import { kernelEventBus }
from "../events/kernel-event-bus";

class KernelRealtimeRouter {

  broadcast(channel: string, payload: any) {

    kernelEventBus.emit({
      type: "REALTIME_BROADCAST",
      source: channel,
      payload,
      timestamp: Date.now()
    });
  }
}

export const kernelRealtimeRouter =
  new KernelRealtimeRouter();
