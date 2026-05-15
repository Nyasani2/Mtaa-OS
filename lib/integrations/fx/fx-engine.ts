export function calculateFX(
  amount: number,
  from: string,
  to: string
) {
  const rates: Record<string, number> = {
    KES_USD: 0.0077,
    USD_KES: 130,
    UGX_USD: 0.00026,
    USD_UGX: 3850,
  };

  const key = `${from}_${to}`;
  const baseRate = rates[key] || 1;
  const spread = 0.012;
  const converted = amount * baseRate;
  const fee = converted * spread;

  return {
    convertedAmount: converted - fee,
    fxRate: baseRate,
    fee,
    revenue: fee,
  };
}
