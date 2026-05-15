import { analyzeBehavior } from "../behavior-models/hookup-behavior-engine";
import { calculateChemistry } from "../chemistry-engine/hookup-chemistry-engine";
import { culturalMatchScore } from "../compatibility/hookup-compatibility-engine";

export function calculateMatch(userA: any, userB: any) {

  const behaviorA = analyzeBehavior(userA.messages || []);
  const behaviorB = analyzeBehavior(userB.messages || []);

  const chemistry = calculateChemistry(userA.interactions || {});
  const cultural = culturalMatchScore(userA, userB);

  const trust = (userA.trust_score + userB.trust_score) / 2;

  const final =
    (
      behaviorA.behavior_score +
      behaviorB.behavior_score +
      chemistry.chemistry_score +
      cultural.cultural_score +
      trust
    ) / 5;

  return {
    compatibility_score: Math.round(final),
    breakdown: {
      behavior: behaviorA.behavior_score,
      behavior_b: behaviorB.behavior_score,
      chemistry: chemistry.chemistry_score,
      cultural: cultural.cultural_score,
      trust,
    },
  };
}
