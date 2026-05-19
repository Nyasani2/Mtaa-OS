import { supabase } from "../../supabase";
import { runDispatchMatching } from "../../mtruck/dispatch/mtruck-dispatch-brain";
import { computeSurgePricing } from "../../mtruck/pricing/mtruck-surge-engine";

export async function runAutonomousDispatchCycle() {

  const surge = await computeSurgePricing();
  const dispatch = await runDispatchMatching();

  const list = Array.isArray(dispatch.matches)
    ? dispatch.matches
    : dispatch.matched || [];

  const optimized = list.map(d => ({
    ...d,
    auto_approved: true,
  }));

  await supabase
    .from("mtaa_autonomous_dispatch_logs")
    .insert({
      surge,
      dispatch_count: list.length,
      created_at: new Date().toISOString(),
    });

  return {
    mode: "AUTONOMOUS",
    surge,
    optimized,
  };
}
