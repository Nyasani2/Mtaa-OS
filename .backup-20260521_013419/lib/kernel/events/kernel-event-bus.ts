type Handler = (payload?: any) => void | Promise<void>;

class KernelEventBus {
  private listeners = new Map<string, Handler[]>();

  on(event: string, handler: Handler) {
    const existing = this.listeners.get(event) || [];
    existing.push(handler);
    this.listeners.set(event, existing);
  }

  async emit(event: any) {
    const type =
      typeof event === 'string'
        ? event
        : event?.type;

    const handlers =
      this.listeners.get(type) || [];

    for (const handler of handlers) {
      await handler(event);
    }
  }
}

export const eventBus = new KernelEventBus();
