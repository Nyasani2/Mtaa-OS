import { emitGlobalEvent } from "../bus/mtaa-interapp-bus";
import { runPlugin } from "../plugins/mtruck-plugin-registry";
import { processSettlement } from "../finance/mtruck-settlement-engine";

export async function executePlatformFlow(context: any) {

  // 1. Dispatch event to all apps
  emitGlobalEvent({
    type: "MTRUCK:DISPATCH",
    payload: context,
    timestamp: new Date().toISOString(),
  });

  // 2. Run plugins (3rd party logic)
  if (context.plugin_id) {
    await runPlugin(context.plugin_id, context);
  }

  // 3. If payment exists → settle instantly
  if (context.amount) {
    await processSettlement({
      trip_id: context.trip_id,
      total_amount: context.amount,
    });
  }

  return {
    status: "PLATFORM_FLOW_EXECUTED",
  };
}
