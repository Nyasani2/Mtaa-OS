export interface CompatibilityInput {

  religion?: string;

  relationship_goal?: string;

  relationship_structure?: string;

  languages?: string[];

  country?: string;

  interests?: string[];
}

export function calculateCompatibility(
  a: CompatibilityInput,
  b: CompatibilityInput
) {

  let score = 50;

  if (
    a.religion &&
    b.religion &&
    a.religion === b.religion
  ) {
    score += 15;
  }

  if (
    a.relationship_goal &&
    b.relationship_goal &&
    a.relationship_goal ===
      b.relationship_goal
  ) {
    score += 20;
  }

  if (
    a.relationship_structure &&
    b.relationship_structure &&
    a.relationship_structure ===
      b.relationship_structure
  ) {
    score += 15;
  }

  const sharedLanguages =
    (a.languages || []).filter(
      lang =>
        (b.languages || []).includes(lang)
    );

  score += sharedLanguages.length * 5;

  if (
    a.country &&
    b.country &&
    a.country === b.country
  ) {
    score += 10;
  }

  if (score > 99) {
    score = 99;
  }

  return score;
}
