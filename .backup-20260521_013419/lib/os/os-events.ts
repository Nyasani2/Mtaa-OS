type EventType = "apps_changed";
type Listener = () => void;

class OSEventBus {
  private listeners: Record<EventType, Listener[]> = {
    apps_changed: [],
  };

  emit(event: EventType) {
    this.listeners[event].forEach(cb => cb());
  }

  subscribe(event: EventType, callback: Listener) {
    this.listeners[event].push(callback);

    return () => {
      this.listeners[event] = this.listeners[event].filter(
        cb => cb !== callback
      );
    };
  }
}

export const osEvents = new OSEventBus();
