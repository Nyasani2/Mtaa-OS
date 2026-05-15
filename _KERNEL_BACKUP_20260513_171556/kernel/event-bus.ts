/**
 * MTAA OS - Kernel Event Bus
 */

type EventPayload = {
  type: string;
  domain: string;
  data?: any;
  timestamp: number;
};

type Listener = (event: EventPayload) => void;

class EventBus {
  private listeners: Map<string, Listener[]> = new Map();

  emit(event: EventPayload) {
    const list = this.listeners.get(event.type) || [];
    list.forEach(fn => fn(event));
  }

  on(type: string, fn: Listener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(fn);
  }

  off(type: string, fn: Listener) {
    const list = this.listeners.get(type) || [];
    this.listeners.set(type, list.filter(f => f !== fn));
  }
}

export const eventBus = new EventBus();
