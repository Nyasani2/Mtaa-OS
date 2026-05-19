export const LivingMuseum = {
  evolveCulture(tribeName: string, activityLevel: number) {
    let evolution = "stable";

    if (activityLevel > 80) evolution = "expanding oral traditions";
    if (activityLevel > 150) evolution = "reviving ancestral narratives";

    return {
      tribe: tribeName,
      cultural_state: evolution,
      narrative:
        "The tribe's identity evolves based on participation, storytelling, and shared memory."
    };
  }
};
