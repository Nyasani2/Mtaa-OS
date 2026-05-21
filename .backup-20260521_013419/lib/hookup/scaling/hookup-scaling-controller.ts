export function autoScale(
  active_users: number
) {

  if (active_users > 1000000) {
    return {
      mode: "HORIZONTAL_SCALE",
      shards: 12,
    };
  }

  if (active_users > 100000) {
    return {
      mode: "VERTICAL_SCALE",
      cache_boost: true,
    };
  }

  return {
    mode: "STANDARD",
  };
}
