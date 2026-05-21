// lib/integrations/rails/rail-registry.ts
import { createClient } from '@/lib/supabase/client';

export interface RailConfig {
  id: string; name: string; type: 'payment'|'data'|'messaging'|'identity'|'storage';
  endpoint: string; status: 'active'|'inactive'|'degraded'; authType: 'apikey'|'oauth2'|'jwt'|'none';
  lastHealthCheck: string|null; metadata: Record<string, unknown>;
}

export interface RailConnection {
  railId: string; config: RailConfig; connected: boolean;
  latencyMs: number; errorRate: number; lastUsed: string|null;
}

class RailRegistry {
  private rails = new Map<string, RailConfig>();
  private connections = new Map<string, RailConnection>();
  private supabase = createClient();

  async registerRail(config: RailConfig): Promise<void> {
    this.rails.set(config.id, config);
    await this.supabase.from('rail_integrations').upsert({
      id: config.id, name: config.name, type: config.type, endpoint: config.endpoint,
      status: config.status, auth_type: config.authType, metadata: config.metadata,
      updated_at: new Date().toISOString(),
    });
  }

  async connect(railId: string): Promise<RailConnection> {
    const config = this.rails.get(railId);
    if (!config) throw new Error(`Rail ${railId} not registered`);
    const start = Date.now(); let connected = false; let latencyMs = 0;
    try {
      const res = await fetch(config.endpoint + '/health', { method: 'HEAD', headers: this.buildHeaders(config) });
      connected = res.ok; latencyMs = Date.now() - start;
    } catch { connected = false; latencyMs = -1; }
    const conn: RailConnection = { railId, config, connected, latencyMs, errorRate: 0, lastUsed: new Date().toISOString() };
    this.connections.set(railId, conn); return conn;
  }

  async disconnect(railId: string): Promise<void> { this.connections.delete(railId); }
  getConnection(railId: string): RailConnection|undefined { return this.connections.get(railId); }
  getAllConnections(): RailConnection[] { return Array.from(this.connections.values()); }
  getActiveRails(): RailConfig[] { return Array.from(this.rails.values()).filter(r => r.status === 'active'); }

  private buildHeaders(config: RailConfig): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.authType === 'apikey') h['X-API-Key'] = (config.metadata.apiKey as string) || '';
    else if (config.authType === 'jwt') h['Authorization'] = `Bearer ${(config.metadata.token as string) || ''}`;
    return h;
  }
}

export const railRegistry = new RailRegistry();
export function useRailRegistry() {
  return {
    register: (c: RailConfig) => railRegistry.registerRail(c),
    connect: (id: string) => railRegistry.connect(id),
    disconnect: (id: string) => railRegistry.disconnect(id),
    getAll: () => railRegistry.getAllConnections(),
    getActive: () => railRegistry.getActiveRails(),
  };
}
