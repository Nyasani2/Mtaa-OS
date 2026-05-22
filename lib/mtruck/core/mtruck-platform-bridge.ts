// lib/mtruck/core/mtruck-platform-bridge.ts
import { runEconomyLoop } from "./mtruck-economy-loop";

export class MTruckPlatformBridge {
  static async process(payload: any): Promise<any> {
    const state = runEconomyLoop(payload);
    return {
      success: true,
      dispatched: state.dispatched,
      matched: state.matched.length,
      decision: state.control.decision,
    };
  }

  static async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return { status: "healthy", timestamp: new Date().toISOString() };
  }
}
