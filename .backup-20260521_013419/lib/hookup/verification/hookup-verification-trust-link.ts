import {
  updateTrustScore
} from "../trust/hookup-trust-engine";

export async function onVerificationSuccess(
  user_id: string,
  type: string
) {

  let boost = 0;

  switch (type) {

    case "PHONE":
      boost = 10;
      break;

    case "EMAIL":
      boost = 5;
      break;

    case "GOV_ID":
      boost = 30;
      break;

    case "BIOMETRIC":
      boost = 40;
      break;

    case "LIVENESS":
      boost = 20;
      break;
  }

  await updateTrustScore(user_id, boost);
}
