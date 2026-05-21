export function autoModerateContent(
  content: string
) {

  const riskWords = [
    "send money",
    "crypto investment",
    "urgent help",
    "gift card",
    "bitcoin transfer"
  ];

  let risk = 0;

  riskWords.forEach(word => {
    if (
      content
        .toLowerCase()
        .includes(word)
    ) {
      risk += 30;
    }
  });

  return {
    action:
      risk > 70
        ? "AUTO_BAN"
        : risk > 40
        ? "FLAG_FOR_REVIEW"
        : "ALLOW",
    risk_score: Math.min(risk, 100),
  };
}
