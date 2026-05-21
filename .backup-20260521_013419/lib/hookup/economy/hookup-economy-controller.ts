import {
  addTokens,
  deductTokens,
} from "./hookup-token-engine";

import {
  activateBoost,
} from "../boosts/hookup-boost-engine";

export async function purchaseBoostFlow(
  user_id: string,
  duration: number
) {

  const cost = duration * 0.5;

  await deductTokens(user_id, cost);

  return await activateBoost(
    user_id,
    "PROFILE",
    duration
  );
}
