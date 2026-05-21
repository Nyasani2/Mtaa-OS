export function safetyAdvice(
  context: string
) {

  const riskyPatterns = [
    "send money",
    "meet urgently",
    "secret investment",
    "bitcoin transfer",
    "gift card"
  ];

  let risk = 0;

  riskyPatterns.forEach(p => {
    if (
      context
        .toLowerCase()
        .includes(p)
    ) {
      risk += 30;
    }
  });

  return {
    safe: risk < 40,
    risk_level:
      risk > 70
        ? "HIGH"
        : risk > 40
        ? "MEDIUM"
        : "LOW",
    recommendation:
      risk > 40
        ? "Stop interaction and verify identity"
        : "Safe to continue",
  };
}
