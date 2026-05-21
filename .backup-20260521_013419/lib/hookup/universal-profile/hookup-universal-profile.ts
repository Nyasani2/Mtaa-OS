export function buildUniversalProfile(
  base_profile: any,
  passport: any
) {

  return {
    display_name: base_profile.name,
    age: base_profile.age,
    country: base_profile.country,

    reputation:
      passport.global_reputation_score,

    verification:
      passport.verification_level,

    trust_tier:
      passport.global_reputation_score > 80
        ? "HIGH_TRUST"
        : passport.global_reputation_score > 50
        ? "STANDARD"
        : "LOW_TRUST",

    cross_app_enabled: true,
  };
}
