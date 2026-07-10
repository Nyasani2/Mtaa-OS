import { supabase } from "../../supabase";

export interface FreightSettlement {
  shipment_id: string;

  customer_id: string;

  driver_id: string;

  total_amount: number;

  platform_fee: number;

  tax_amount: number;

  driver_payout: number;
}

export async function settleFreightPayment(
  shipmentId: string,
  totalAmount: number
): Promise<FreightSettlement> {

  const platformFee =
    totalAmount * 0.10;

  const taxAmount =
    totalAmount * 0.10;

  const driverPayout =
    totalAmount -
    platformFee -
    taxAmount;

  const { data: shipment } =
    await supabase
      .from("mtruck_shipments")
      .select("*")
      .eq("id", shipmentId)
      .single();

  const settlement = {
    shipment_id: shipmentId,

    customer_id:
      shipment.customer_id,

    driver_id:
      shipment.driver_id,

    total_amount:
      totalAmount,

    platform_fee:
      platformFee,

    tax_amount:
      taxAmount,

    driver_payout:
      driverPayout,
  };

  const { error } = await supabase
    .from("mtruck_freight_settlements")
    .insert(settlement);

  if (error) throw error;

  return settlement;
}
