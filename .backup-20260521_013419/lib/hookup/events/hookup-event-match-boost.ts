export function eventMatchBoost(
  base_score: number,
  same_event: boolean
) {

  if (same_event) {
    return base_score + 20;
  }

  return base_score;
}
