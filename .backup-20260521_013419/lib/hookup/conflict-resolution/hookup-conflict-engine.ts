export function resolveConflictScenario(
  scenario: string
) {

  return {
    steps: [
      "Pause emotional escalation before responding.",
      "Identify the core issue, not surface arguments.",
      "Avoid public confrontation in chat.",
      "Use 'I feel' statements instead of blame.",
      "Agree on a resolution timeframe."
    ],
    warning:
      "Escalation detected — recommend cooling period."
  };
}
