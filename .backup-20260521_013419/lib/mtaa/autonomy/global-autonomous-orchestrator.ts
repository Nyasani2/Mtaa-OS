import { runAutonomousDispatchCycle } from "./autonomous-dispatch-core";
import { analyzeTradeVolume } from "../trade/africa-digital-trade-layer";

export async function runGlobalAutonomousSystem() {

  const dispatch = await runAutonomousDispatchCycle();
  const trade = await analyzeTradeVolume();

  const system_state =
    trade.total_flows > 1000
      ? "HIGH_ACTIVITY"
      : "NORMAL";

  return {
    dispatch,
    trade,
    system_state,
    autonomy_level: "FULL_CONTINENTAL_AUTONOMY",
  };
}
