export function updateMatchOutcome(
  match_id: string,
  outcome: "SUCCESS" | "FAILED"
) {

  return {
    adjustment:
      outcome === "SUCCESS"
        ? +10
        : -15,
    match_id,
  };
}
