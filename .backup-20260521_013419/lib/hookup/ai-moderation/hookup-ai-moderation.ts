export function scanMessage(
  text: string
) {

  const suspiciousPatterns = [
    "send money",
    "crypto investment",
    "urgent help",
    "gift card",
    "bitcoin transfer",
  ];

  let risk = 0;

  suspiciousPatterns.forEach(pattern => {

    if (
      text
        .toLowerCase()
        .includes(pattern)
    ) {
      risk += 25;
    }
  });

  return {
    safe: risk < 50,
    risk_score: Math.min(risk, 100),
    action:
      risk > 50
        ? "BLOCK_OR_FLAG"
        : "ALLOW",
  };
}
