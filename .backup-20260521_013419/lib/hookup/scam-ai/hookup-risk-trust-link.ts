import {
  updateTrustScore
} from "../trust/hookup-trust-engine";

export async function onFraudDetected(
  user_id: string
) {

  // heavy penalty for scam behavior
  await updateTrustScore(user_id, -40);
}

export async function onSafeBehavior(
  user_id: string
) {

  await updateTrustScore(user_id, +5);
}
