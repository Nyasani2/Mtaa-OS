export function analyzeUserAcrossApps(
  events: any[]
) {

  let trust = 50;
  let activity = 0;

  events.forEach(e => {

    activity++;

    if (e.event_type === "PAYMENT")
      trust += 5;

    if (e.event_type === "RIDE")
      trust += 2;

    if (e.event_type === "FRAUD")
      trust -= 30;
  });

  return {
    ecosystem_trust_score:
      Math.max(0, Math.min(100, trust)),
    activity_level: activity,
  };
}
