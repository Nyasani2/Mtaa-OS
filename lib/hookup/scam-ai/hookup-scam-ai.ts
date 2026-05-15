export function detectScamPatterns(
  messages: string[]
) {

  const scamKeywords = [
    "send money",
    "urgent transfer",
    "crypto investment",
    "gift card",
    "help me financially",
    "wire transfer"
  ];

  let risk = 0;

  messages.forEach(msg => {

    scamKeywords.forEach(keyword => {

      if (
        msg
          .toLowerCase()
          .includes(keyword)
      ) {
        risk += 25;
      }
    });
  });

  return {
    scam_risk:
      Math.min(risk, 100),
    action:
      risk > 60
        ? "BLOCK_AND_FLAG"
        : risk > 30
        ? "WARN_USER"
        : "ALLOW",
  };
}
