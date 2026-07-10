import { supabase } from "../../supabase";

const FX_RATES: Record<string, number> = {
  KES: 1,
  UGX: 0.034,
  TZS: 0.00042,
  USD: 130,
};

export function convertCurrency(
  amount: number,
  from: string,
  to: string
) {

  const base = amount * FX_RATES[from];
  return base / FX_RATES[to];
}

export async function settleCrossBorderPayment(
  amount: number,
  currency: string
) {

  const usdValue =
    convertCurrency(amount, currency, "USD");

  const platform_fee = usdValue * 0.1;

  const settlement = {
    gross_usd: usdValue,
    platform_fee,
    net_usd: usdValue - platform_fee,
    timestamp: new Date().toISOString(),
  };

  await supabase
    .from("mtaa_cross_border_settlements")
    .insert(settlement);

  return settlement;
}
