export function calculateRoomLoad(
  participants: number
) {

  if (participants < 5)
    return "LIGHT";

  if (participants < 20)
    return "MEDIUM";

  return "HEAVY";
}
