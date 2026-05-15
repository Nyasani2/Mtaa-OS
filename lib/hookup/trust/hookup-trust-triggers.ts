import {
  updateTrustScore,
} from "./hookup-trust-engine";

export async function onReportReceived(
  user_id: string
) {

  await updateTrustScore(user_id, -15);
}

export async function onSuccessfulVerification(
  user_id: string
) {

  await updateTrustScore(user_id, +25);
}

export async function onPositiveInteraction(
  user_id: string
) {

  await updateTrustScore(user_id, +5);
}
