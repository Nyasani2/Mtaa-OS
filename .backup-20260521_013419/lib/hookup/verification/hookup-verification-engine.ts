import { supabase } from "../../supabase";

export async function submitVerification(
  user_id: string,
  type:
    | "EMAIL"
    | "PHONE"
    | "GOV_ID"
    | "BIOMETRIC"
    | "LIVENESS",
  document_url?: string
) {

  const { data, error } =
    await supabase
      .from("hookup_verifications")
      .insert({
        user_id,
        verification_type: type,
        document_url,
        status: "PENDING",
      })
      .select()
      .single();

  if (error) throw error;

  return data;
}

export async function approveVerification(
  verification_id: string,
  confidence: number
) {

  const { data, error } =
    await supabase
      .from("hookup_verifications")
      .update({
        status: "VERIFIED",
        confidence_score: confidence,
        verified_at: new Date(),
      })
      .eq("id", verification_id)
      .select()
      .single();

  if (error) throw error;

  return data;
}
