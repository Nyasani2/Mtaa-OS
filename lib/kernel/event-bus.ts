type Handler = (payload?: any) => void;

class EventBus {
  private listeners: Record<string, Handler[]> = {};

  on(event: string, handler: Handler) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(handler);
  }

  emit(event: string, payload?: any) {
    (this.listeners[event] || []).forEach((handler) => {
      handler(payload);
    });
  }
}

export const eventBus = new EventBus();
