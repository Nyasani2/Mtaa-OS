import { supabase } from "../../supabase";

export async function registerTradeFlow(flow: any) {

  const processed = {
    ...flow,
    status: "DIGITIZED",
    compliance_checked: true,
    routed: true,
  };

  await supabase
    .from("mtaa_digital_trade_flows")
    .insert(processed);

  return processed;
}

export async function analyzeTradeVolume() {

  const { data } = await supabase
    .from("mtaa_digital_trade_flows")
    .select("*");

  return {
    total_flows: data?.length || 0,
    active_countries: new Set(
      (data || []).map((d: any) => d.origin_country)
    ).size,
  };
}
