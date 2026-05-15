export type RailStatus = 'online' | 'degraded' | 'offline';

export interface RailHealth {
  name: string;
  status: RailStatus;
  latency_ms: number;
  last_checked: string;
}

class RailMonitor {
  private status: Record<string, RailHealth> = {};

  update(name: string, status: RailStatus, latency_ms: number) {
    this.status[name] = {
      name,
      status,
      latency_ms,
      last_checked: new Date().toISOString(),
    };
  }

  get(name: string): RailHealth | undefined {
    return this.status[name];
  }

  all(): RailHealth[] {
    return Object.values(this.status);
  }

  offline(): RailHealth[] {
    return this.all().filter(r => r.status === 'offline');
  }
}

export const railMonitor = new RailMonitor();
