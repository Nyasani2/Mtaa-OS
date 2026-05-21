type EventType =
  | "GPS_UPDATE"
  | "SHIPMENT_CREATED"
  | "TRUCK_ASSIGNED"
  | "TRAFFIC_SPIKE"
  | "FUEL_ALERT"
  | "SYSTEM_TICK";

interface MTruckEvent {
  type: EventType;
  payload: any;
  timestamp: string;
}

const subscribers: Record<
  string,
  ((event: MTruckEvent) => void)[]
> = {};

export function emitEvent(event: MTruckEvent) {
  const handlers = subscribers[event.type] || [];

  for (const handler of handlers) {
    try {
      handler(event);
    } catch (e) {
      console.error("Event handler error:", e);
    }
  }
}

export function subscribe(
  type: EventType,
  handler: (event: MTruckEvent) => void
) {
  if (!subscribers[type]) {
    subscribers[type] = [];
  }

  subscribers[type].push(handler);
}

export function createEvent(type: EventType, payload: any): MTruckEvent {
  return {
    type,
    payload,
    timestamp: new Date().toISOString(),
  };
}
