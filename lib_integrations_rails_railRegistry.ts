// MTAA Rail Integration Registry
export interface RailConnection {
  id: string;
  name: string;
  endpoint: string;
  status: 'active' | 'inactive' | 'pending';
  lastSync?: string;
}

class RailRegistry {
  connections: RailConnection[] = [];

  get list(): RailConnection[] {
    return this.connections;
  }

  register(conn: RailConnection) {
    this.connections.push(conn);
  }

  getActive() {
    return this.connections.filter(c => c.status === 'active');
  }
}

export const railRegistry = new RailRegistry();
export default railRegistry;
