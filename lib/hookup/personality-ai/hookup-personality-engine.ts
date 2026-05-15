export function simulatePersonality(user: any) {

  const openness = (user.traits?.openness || 50);
  const emotional_stability = (user.traits?.stability || 50);
  const sociability = (user.traits?.sociability || 50);

  return {
    personality_vector: {
      openness,
      emotional_stability,
      sociability,
    },

    dating_style:
      openness > 70
        ? "EXPLORER"
        : emotional_stability > 70
        ? "STABLE_LONG_TERM"
        : "CASUAL_SOCIAL",

    response_tone:
      sociability > 70 ? "EXPRESSIVE" : "RESERVED"
  };
}
