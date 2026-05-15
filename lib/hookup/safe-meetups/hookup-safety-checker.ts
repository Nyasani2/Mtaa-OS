export function evaluateMeetupSafety(
  userA: any,
  userB: any,
  location: any
) {

  let risk = 0;

  if (userA.trust_score < 40) risk += 30;
  if (userB.trust_score < 40) risk += 30;

  if (location.is_private_area)
    risk += 20;

  if (location.night_time)
    risk += 10;

  return {
    safe: risk < 50,
    risk_level:
      risk > 70
        ? "HIGH"
        : risk > 40
        ? "MEDIUM"
        : "LOW",
  };
}
