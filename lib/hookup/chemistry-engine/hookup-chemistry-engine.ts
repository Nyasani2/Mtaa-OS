export function calculateChemistry(
  interactions: any
) {

  let score = 50;

  if (interactions.messages > 20)
    score += 10;

  if (interactions.calls > 3)
    score += 15;

  if (interactions.replies_fast)
    score += 10;

  if (interactions.ignored_messages > 5)
    score -= 20;

  return {
    chemistry_score:
      Math.max(0, Math.min(100, score)),
  };
}
