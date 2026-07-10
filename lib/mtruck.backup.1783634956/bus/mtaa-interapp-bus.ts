type AppEvent =
  | "MTRUCK:DISPATCH"
  | "MTRUCK:PAYMENT"
  | "MTRUCK:TRACKING_UPDATE"
  | "MTAXI:RIDE_REQUEST"
  | "MARKETPLACE:LISTING_CREATED";

export interface MTAAEvent {
  type: AppEvent;
  payload: any;
  timestamp: string;
}

const listeners: Record<string, Function[]> = {};

export function emitGlobalEvent(event: MTAAEvent) {

  const subs = listeners[event.type] || [];

  for (const fn of subs) {
    fn(event.payload);
  }
}

export function subscribeGlobal(
  type: AppEvent,
  fn: Function
) {

  if (!listeners[type]) {
    listeners[type] = [];
  }

  listeners[type].push(fn);
}
