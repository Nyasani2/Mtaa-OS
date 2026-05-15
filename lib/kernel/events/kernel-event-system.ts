export type KernelEventDomain =
  | 'kernel'
  | 'system'
  | 'mtruck'
  | 'streets'
  | '*';

export interface KernelEvent { priority?: string; 
  domain: KernelEventDomain;
  type: string;
  payload?: any;
  timestamp?: number;
}

type Listener = {
  domain: KernelEventDomain | KernelEventDomain[];
  types?: string[];
  handler: (event: KernelEvent) => void | Promise<void>;
};

export class KernelEventSystem {
  private static instance: KernelEventSystem | null = null;

  static getInstance() {
    if (!this.instance) {
      this.instance = new KernelEventSystem();
    }
    return this.instance;
  }

  private listeners = new Map<string, Listener[]>();

  private key(domain: any, types?: string[]) {
    const d = Array.isArray(domain) ? domain.join(',') : domain;
    return `${d}:${(types || []).join(',')}`;
  }

  subscribe(sub: Listener) {
    const k = this.key(sub.domain, sub.types);
    if (!this.listeners.has(k)) this.listeners.set(k, []);
    this.listeners.get(k)!.push(sub);
  }

  emit(event: KernelEvent) {
    for (const [, handlers] of this.listeners.entries()) {
      handlers.forEach(h => {
        Promise.resolve(h.handler(event)).catch(console.error);
      });
    }
  }

  publish(event: KernelEvent) {
    return this.emit({
      ...event,
      timestamp: event.timestamp || Date.now(),
    });
  }

  boot() {
    this.emit({
      domain: 'kernel',
      type: 'kernel.event_system.booted',
      payload: {},
      timestamp: Date.now(),
    });
  }
}

export const kernelEventBus = KernelEventSystem.getInstance();
