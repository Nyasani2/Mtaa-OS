/**
 * MARKETPLACE PRICING ENGINE
 */

export function calculateMarketplacePrice(input: {
  base_price: number;
  quantity: number;
  urgency: "LOW" | "NORMAL" | "HIGH";
}) {
  const subtotal = input.base_price * input.quantity;

  const urgencyMultiplier =
    input.urgency === "HIGH" ? 1.3 :
    input.urgency === "NORMAL" ? 1.1 : 1;

  const system_fee = subtotal * 0.10; // unified MTAA 10%
  const total = subtotal * urgencyMultiplier + system_fee;

  return {
    subtotal,
    system_fee,
    total,
  };
}
