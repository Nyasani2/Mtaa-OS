export function scanLiveRoomActivity(
  speech_text: string
) {

  const flagged = [
    "send money",
    "meet urgently",
    "bitcoin",
    "private transfer",
  ];

  let risk = 0;

  flagged.forEach(word => {
    if (
      speech_text
        .toLowerCase()
        .includes(word)
    ) {
      risk += 30;
    }
  });

  return {
    action:
      risk > 60
        ? "AUTO_MUTE_OR_REMOVE"
        : "ALLOW",
    risk_score: Math.min(risk, 100),
  };
}
