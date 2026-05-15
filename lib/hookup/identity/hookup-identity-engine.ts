import { supabase } from "../../supabase";

export async function logIdentitySignal(
  user_id: string,
  signal_type: string,
  signal_value: any
) {

  const { data, error } =
    await supabase
      .from("hookup_identity_signals")
      .insert({
        user_id,
        signal_type,
        signal_value,
        weight: 1,
      });

  if (error) throw error;

  return data;
}

export function calculateIdentityStrength(
  signals: any[]
) {

  let score = 0;

  signals.forEach(signal => {

    switch (signal.signal_type) {

      case "PHONE_VERIFIED":
        score += 20;
        break;

      case "EMAIL_VERIFIED":
        score += 10;
        break;

      case "FACE_VERIFIED":
        score += 30;
        break;

      case "GOV_ID":
        score += 40;
        break;
    }
  });

  return Math.min(score, 100);
}
