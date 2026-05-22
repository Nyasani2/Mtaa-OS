export interface RailRequest {
  route: string;
  payload?: any;
}

export interface RailResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export function createRailRouter() {
  const handlers = new Map<string, (payload: any) => Promise<RailResponse>>();

  return {
    register: (route: string, handler: (payload: any) => Promise<RailResponse>) => {
      handlers.set(route, handler);
    },
    send: async (request: RailRequest): Promise<RailResponse> => {
      const handler = handlers.get(request.route);
      if (!handler) return { success: false, error: "Route not found" };
      return handler(request.payload);
    },
  };
}

export type RailRouter = ReturnType<typeof createRailRouter>;
