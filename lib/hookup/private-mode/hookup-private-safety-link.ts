export function flagPrivateAbuse(
  room_id: string,
  risk_level: number
) {

  return {
    action:
      risk_level > 70
        ? "FORCE_UNLOCK_AND_REVIEW"
        : "MONITOR_ONLY",
    room_id,
  };
}
