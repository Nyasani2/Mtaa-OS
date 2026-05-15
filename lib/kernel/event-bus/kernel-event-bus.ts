type KernelEvent = {
  type: string;
  payload: any;
  timestamp: number;
};

type Listener = (event: KernelEvent) => void;

class KernelEventBus {
  private listeners: Map<string, Listener[]> = new Map();

  emit(type: string, payload: any) {
    const event: KernelEvent = {
      type,
      payload,
      timestamp: Date.now()
    };

    const subs = this.listeners.get(type) || [];

    for (const fn of subs) {
      try {
        fn(event);
      } catch (err) {
        console.error("EVENT_HANDLER_ERROR:", err);
      }
    }
  }

  on(type: string, fn: Listener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }

    this.listeners.get(type)!.push(fn);
  }

  off(type: string, fn: Listener) {
    const subs = this.listeners.get(type);
    if (!subs) return;

    this.listeners.set(
      type,
      subs.filter((f) => f !== fn)
    );
  }

  clear() {
    this.listeners.clear();
  }
}

export const kernelEventBus = new KernelEventBus();
