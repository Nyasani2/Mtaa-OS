export interface PreferenceProfile {

  age_range: [number, number];

  religion_required?: boolean;

  allows_polygamy?: boolean;

  smoking?: boolean;

  drinking?: boolean;

  location_radius_km?: number;
}

export function filterMatch(
  user: PreferenceProfile,
  candidate: PreferenceProfile
) {

  if (
    candidate.age_range[0] <
      user.age_range[0] ||
    candidate.age_range[1] >
      user.age_range[1]
  ) {
    return false;
  }

  if (
    user.religion_required &&
    !candidate.religion_required
  ) {
    return false;
  }

  return true;
}
