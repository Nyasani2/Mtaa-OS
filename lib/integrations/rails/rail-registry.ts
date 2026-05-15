export type RailType =
  | 'mobile_money'
  | 'bank'
  | 'crypto'
  | 'card'
  | 'international';

export interface RailAdapter {
  name: string;
  type: RailType;
  country?: string;
  send: (payload: any) => Promise<any>;
  receive: (payload: any) => Promise<any>;
}

class RailRegistry {
  private rails: Map<string, RailAdapter> = new Map();

  register(rail: RailAdapter) {
    this.rails.set(rail.name, rail);
  }

  get(name: string): RailAdapter | undefined {
    return this.rails.get(name);
  }

  list(): RailAdapter[] {
    return Array.from(this.rails.values());
  }

  byType(type: RailType): RailAdapter[] {
    return this.list().filter(r => r.type === type);
  }
}

export const railRegistry = new RailRegistry();
