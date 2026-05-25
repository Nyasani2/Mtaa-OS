type EventCallback = (data: any) => void;

class KernelEventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }
  off(event: string, callback: EventCallback): void { this.listeners.get(event)?.delete(callback); }
  emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach(cb => { try { cb(data); } catch (err) { console.error(`EventBus error on ${event}:`, err); } });
  }
}

export const kernelEventBus = new KernelEventBus();
