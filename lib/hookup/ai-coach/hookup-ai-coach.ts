export interface RelationshipContext {

  user_id: string;

  partner_id?: string;

  stage:
    | "MATCHED"
    | "CHATTING"
    | "DATING"
    | "COMMITTED"
    | "MARRIED";

  issue_type?:
    | "COMMUNICATION"
    | "TRUST"
    | "LONG_DISTANCE"
    | "FAMILY_PRESSURE"
    | "CULTURAL";

  message_history?: string[];
}

export function generateAdvice(
  context: RelationshipContext
) {

  const advice: string[] = [];

  switch (context.issue_type) {

    case "COMMUNICATION":
      advice.push(
        "Encourage clear emotional expression without blame."
      );
      advice.push(
        "Avoid assumptions — ask direct questions."
      );
      break;

    case "TRUST":
      advice.push(
        "Rebuild trust through consistent actions, not words."
      );
      advice.push(
        "Transparency is more effective than reassurance."
      );
      break;

    case "LONG_DISTANCE":
      advice.push(
        "Set structured communication schedules."
      );
      advice.push(
        "Avoid emotional dependency on instant replies."
      );
      break;

    case "FAMILY_PRESSURE":
      advice.push(
        "Balance personal choice with cultural respect."
      );
      advice.push(
        "Involve family gradually, not abruptly."
      );
      break;

    case "CULTURAL":
      advice.push(
        "Acknowledge differences without forcing alignment."
      );
      advice.push(
        "Focus on shared values, not identical traditions."
      );
      break;

    default:
      advice.push(
        "Focus on clarity, respect, and consistency."
      );
  }

  return {
    summary:
      "AI-guided relationship insight generated.",
    advice,
  };
}
