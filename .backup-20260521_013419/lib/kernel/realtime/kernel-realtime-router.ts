import { kernelEventBus } from "../events/kernel-event-system";

export function startRealtimeRouter() {
  kernelEventBus.emit({
    domain: "kernel",
    type: "kernel.realtime.started",
    payload: {},
  });
}
