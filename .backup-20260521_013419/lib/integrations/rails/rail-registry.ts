export interface RailConfig { id: string; name: string; type: string; endpoint: string; status: string; authType: string; metadata: Record<string, unknown>; }
export interface RailConnection { railId: string; config: RailConfig; connected: boolean; latencyMs: number; errorRate: number; lastUsed: string | null; }
class RailRegistry { private rails = new Map(); private connections = new Map();
  registerRail(config: RailConfig) { this.rails.set(config.id, config); }
  connect(railId: string) { const config = this.rails.get(railId); if (!config) throw new Error("Rail not registered"); return { railId, config, connected: true, latencyMs: 0, errorRate: 0, lastUsed: new Date().toISOString() }; }
  getAllConnections() { return Array.from(this.connections.values()); }
  getActiveRails() { return Array.from(this.rails.values()).filter((r: any) => r.status === "active"); }
}
export const railRegistry = new RailRegistry();
export function useRailRegistry() { return { register: (c: RailConfig) => railRegistry.registerRail(c), connect: (id: string) => railRegistry.connect(id), getAll: () => railRegistry.getAllConnections(), getActive: () => railRegistry.getActiveRails() }; }
