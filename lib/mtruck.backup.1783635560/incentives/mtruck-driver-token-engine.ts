import { supabase } from "../../supabase";

export async function awardDriverTokens(
  driver_id: string,
  event: string
) {

  let tokens = 0;

  switch (event) {

    case "ON_TIME_DELIVERY":
      tokens = 10;
      break;

    case "HIGH_RATED_TRIP":
      tokens = 20;
      break;

    case "SURGE_COMPLETION":
      tokens = 30;
      break;

    default:
      tokens = 5;
  }

  const { error } = await supabase
    .from("mtruck_driver_tokens")
    .insert({
      driver_id,
      tokens,
      event,
      created_at: new Date().toISOString(),
    });

  if (error) throw error;

  return { driver_id, tokens, event };
}
