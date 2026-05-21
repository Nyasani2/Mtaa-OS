export async function getUnifiedCreditProfile(
  userId: string
) {
  return {
    userId,
    score: 650,
    risk: 'medium',
  };
}
