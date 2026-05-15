export function detectEmotionalTone(
  text: string
) {

  const lower = text.toLowerCase();

  let score = 0;

  if (
    lower.includes("angry") ||
    lower.includes("hate")
  ) {
    score += 40;
  }

  if (
    lower.includes("sad") ||
    lower.includes("hurt")
  ) {
    score += 30;
  }

  if (
    lower.includes("love") ||
    lower.includes("miss you")
  ) {
    score -= 10;
  }

  return {
    emotional_risk:
      Math.min(score, 100),
    category:
      score > 50
        ? "HIGH_EMOTION"
        : score > 20
        ? "MODERATE"
        : "STABLE",
  };
}
