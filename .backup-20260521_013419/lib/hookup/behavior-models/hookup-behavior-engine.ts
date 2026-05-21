export function analyzeBehavior(
  messages: string[]
) {

  let score = 50;

  const toxicPatterns = [
    "idiot",
    "hate you",
    "scam",
    "block you",
  ];

  const positivePatterns = [
    "how are you",
    "take care",
    "understand",
    "respect"
  ];

  messages.forEach(msg => {

    const text = msg.toLowerCase();

    toxicPatterns.forEach(p => {
      if (text.includes(p)) score -= 10;
    });

    positivePatterns.forEach(p => {
      if (text.includes(p)) score += 5;
    });
  });

  return {
    behavior_score:
      Math.max(0, Math.min(100, score)),
  };
}
