export function assignModeratorRole(
  trust_score: number
) {

  if (trust_score > 90) {
    return "SUPER_MOD";
  }

  if (trust_score > 70) {
    return "MODERATOR";
  }

  return "USER";
}
