// lib/integrations/rails/railRegistry.ts

type RailRequest = {
  [key: string]: any;
};

type RailResponse = {
  success: boolean;
  rail: string;
  data?: any;
  error?: string;
};

class RailRegistry {
  private rails: Record<
    string,
    (payload: RailRequest) => Promise<RailResponse>
  > = {};

  register(
    name: string,
    handler: (payload: RailRequest) => Promise<RailResponse>
  ) {
    this.rails[name] = handler;
  }

  list() {
    return Object.keys(this.rails);
  }

  get(name: string) {
    return this.rails[name] || null;
  }

  async route(name: string, payload: RailRequest): Promise<RailResponse> {
    const handler = this.rails[name];

    if (!handler) {
      return {
        success: false,
        rail: name,
        error: `Rail '${name}' not found`,
      };
    }

    try {
      return await handler(payload);
    } catch (err: any) {
      return {
        success: false,
        rail: name,
        error: err?.message || 'Rail execution failed',
      };
    }
  }
}

// singleton instance (IMPORTANT for OS design)
export const railRegistry = new RailRegistry();

// optional default export (safe)
export default railRegistry;
