type KernelEvent = {
  type: string;
  domain: string;
  timestamp: number;
  data?: any;
};

type Listener = (event: KernelEvent) => void;

class EventBus {
  private listeners = new Map<
    string,
    Set<Listener>
  >();

  private eventHistory = new Map<
    string,
    number
  >();

  on(type: string, listener: Listener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    this.listeners.get(type)?.add(listener);

    return () => {
      this.listeners
        .get(type)
        ?.delete(listener);
    };
  }

  emit(event: KernelEvent) {
    const key =
      `${event.type}:${event.domain}`;

    const now = Date.now();

    const previous =
      this.eventHistory.get(key);

    // duplicate suppression
    if (
      previous &&
      now - previous < 100
    ) {
      return;
    }

    this.eventHistory.set(key, now);

    const listeners =
      this.listeners.get(event.type);

    if (!listeners) return;

    for (const listener of listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error(
          '[EVENT BUS ERROR]',
          err
        );
      }
    }
  }

  listenerCount() {
    let count = 0;

    for (const set of this.listeners.values()) {
      count += set.size;
    }

    return count;
  }

  clear() {
    this.listeners.clear();
  }
}

export const eventBus =
  new EventBus();
