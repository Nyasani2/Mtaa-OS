export function analyzeRisk(profile: any) {

  let risk = 0;

  // fake profile signals
  if (!profile.bio) risk += 10;
  if (!profile.image_url) risk += 25;
  if (!profile.age) risk += 15;

  // suspicious patterns
  if (profile.age && profile.age < 18)
    risk += 100;

  if (profile.trust_score < 30)
    risk += 20;

  return {
    risk_score: Math.min(risk, 100),
    status:
      risk > 70
        ? "HIGH_RISK"
        : risk > 40
        ? "MEDIUM_RISK"
        : "LOW_RISK",
  };
}
