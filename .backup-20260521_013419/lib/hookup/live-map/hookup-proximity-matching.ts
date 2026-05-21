export function proximityBoost(
  distance_km: number,
  base_score: number
) {

  if (distance_km < 1)
    return base_score + 25;

  if (distance_km < 5)
    return base_score + 10;

  return base_score;
}
