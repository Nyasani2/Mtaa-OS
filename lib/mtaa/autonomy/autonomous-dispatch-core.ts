import { supabase } from "../../supabase";
import { runDispatchMatching } from "../../mtruck/dispatch/mtruck-dispatch-brain";
import { computeSurgePricing } from "../../mtruck/pricing/mtruck-surge-engine";

export async function runAutonomousDispatchCycle() {

  const surge = await computeSurgePricing();
  const dispatch = await runDispatchMatching();

  const optimized = dispatch.map(d => ({
    ...d,
    auto_approved: surge.surge_multiplier < 2.0,
    priority_score:
      d.score * surge.surge_multiplier,
  }));

  await supabase
    .from("mtaa_autonomous_dispatch_logs")
    .insert({
      surge,
      dispatch_count: dispatch.length,
      created_at: new Date().toISOString(),
    });

  return {
    mode: "AUTONOMOUS",
    surge,
    optimized,
  };
}
