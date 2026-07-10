import { supabase } from "../../supabase";

export interface CustomsClearance {
  shipment_id: string;

  country_code: string;

  tax_amount: number;

  clearance_status:
    | "PENDING"
    | "APPROVED"
    | "REJECTED";
}

export async function processCustomsClearance(
  clearance: CustomsClearance
) {

  const { data, error } = await supabase
    .from("mtruck_customs_clearance")
    .insert({
      shipment_id:
        clearance.shipment_id,

      country_code:
        clearance.country_code,

      tax_amount:
        clearance.tax_amount,

      clearance_status:
        clearance.clearance_status,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getPendingClearance() {

  const { data, error } = await supabase
    .from("mtruck_customs_clearance")
    .select("*")
    .eq(
      "clearance_status",
      "PENDING"
    );

  if (error) throw error;

  return data || [];
}
