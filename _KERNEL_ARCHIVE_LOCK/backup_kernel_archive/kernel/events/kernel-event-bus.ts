type KernelEvent = {
  type: string;
  source: string;
  payload?: any;
  timestamp: number;
};

type Listener = (event: KernelEvent) => void;

class KernelEventBus {

  private listeners: Map<string, Listener[]> = new Map();

  emit(event: KernelEvent) {

    const handlers = this.listeners.get(event.type) || [];

    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(
          "[KERNEL EVENT ERROR]",
          event.type,
          error
        );
      }
    });
  }

  on(type: string, listener: Listener) {

    const handlers = this.listeners.get(type) || [];

    handlers.push(listener);

    this.listeners.set(type, handlers);
  }

  off(type: string, listener: Listener) {

    const handlers = this.listeners.get(type) || [];

    this.listeners.set(
      type,
      handlers.filter(h => h !== listener)
    );
  }
}

export const kernelEventBus = new KernelEventBus();
