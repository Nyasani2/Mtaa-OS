export interface CultureProfile {

  religion?: string;

  country?: string;

  region?: string;

  language?: string[];

  marriage_view?: string;

  family_structure?: string;
}

export function evaluateCultureMatch(
  a: CultureProfile,
  b: CultureProfile
) {

  let score = 50;

  // religion alignment
  if (
    a.religion &&
    b.religion &&
    a.religion === b.religion
  ) {
    score += 20;
  }

  // language overlap
  const sharedLang =
    (a.language || []).filter(l =>
      (b.language || []).includes(l)
    );

  score += sharedLang.length * 5;

  // marriage worldview compatibility
  if (
    a.marriage_view &&
    b.marriage_view &&
    a.marriage_view === b.marriage_view
  ) {
    score += 15;
  }

  // family structure compatibility
  if (
    a.family_structure &&
    b.family_structure &&
    a.family_structure === b.family_structure
  ) {
    score += 10;
  }

  return Math.min(score, 100);
}
