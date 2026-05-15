/**
 * MTRUCK PRICING ENGINE
 */

export function calculateFreightPrice(input: {
  distance_km: number;
  weight_kg: number;
  urgency: "LOW" | "NORMAL" | "HIGH";
}) {
  const baseRatePerKm = 50; // KES

  const weightFactor =
    input.weight_kg < 10 ? 1 :
    input.weight_kg < 100 ? 1.5 : 2.5;

  const urgencyMultiplier =
    input.urgency === "HIGH" ? 2 :
    input.urgency === "NORMAL" ? 1.3 : 1;

  const subtotal =
    input.distance_km * baseRatePerKm * weightFactor * urgencyMultiplier;

  const system_fee = subtotal * 0.1; // 10% system cut
  const total = subtotal + system_fee;

  return {
    subtotal,
    system_fee,
    total,
  };
}
