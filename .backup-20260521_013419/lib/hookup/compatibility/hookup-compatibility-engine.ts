export function culturalMatchScore(
  a: any,
  b: any
) {

  let score = 50;

  if (a.religion === b.religion)
    score += 20;

  if (a.language === b.language)
    score += 15;

  if (a.country === b.country)
    score += 10;

  if (a.relationship_model === b.relationship_model)
    score += 15;

  return {
    cultural_score:
      Math.min(100, score),
  };
}
