export function analyzeLocation(
  lat: number,
  lng: number
) {

  // placeholder geo intelligence

  const is_safe_zone =
    lat !== 0 && lng !== 0;

  const crowd_level =
    Math.random() * 100;

  return {
    safe_zone: is_safe_zone,
    crowd_density: crowd_level,
    recommended:
      crowd_level < 70,
  };
}
