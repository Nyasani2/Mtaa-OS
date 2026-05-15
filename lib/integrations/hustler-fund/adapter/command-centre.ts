export interface IntegrationAdapter {
  name: string;
  fetchHistory: (user_id: string) => Promise<any>;
  sendLoan?: (payload: any) => Promise<any>;
  repayLoan?: (payload: any) => Promise<any>;
}

class CommandCentre {
  private adapters: Map<string, IntegrationAdapter> = new Map();

  register(adapter: IntegrationAdapter) {
    this.adapters.set(adapter.name, adapter);
  }

  get(name: string): IntegrationAdapter | undefined {
    return this.adapters.get(name);
  }

  list(): IntegrationAdapter[] {
    return Array.from(this.adapters.values());
  }
}

export const commandCentre = new CommandCentre();
