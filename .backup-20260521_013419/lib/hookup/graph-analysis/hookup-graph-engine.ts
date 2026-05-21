export function analyzeUserConnections(
  interactions: any[]
) {

  let risk = 0;

  const reportCount =
    interactions.filter(
      i => i.interaction_type === "REPORT"
    ).length;

  const paymentLinks =
    interactions.filter(
      i => i.interaction_type === "PAYMENT"
    ).length;

  const blockCount =
    interactions.filter(
      i => i.interaction_type === "BLOCK"
    ).length;

  risk += reportCount * 20;
  risk += paymentLinks * 5;
  risk += blockCount * 10;

  return {
    fraud_risk_score:
      Math.min(risk, 100),
    status:
      risk > 70
        ? "HIGH_RISK"
        : risk > 40
        ? "MEDIUM_RISK"
        : "LOW_RISK",
  };
}
