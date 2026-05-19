export const DiplomacyService = {
  getRelationScore(a: string, b: string) {
    // placeholder logic (later from DB)
    const score = Math.floor(Math.random() * 100);

    if (score > 70) return "alliance";
    if (score > 40) return "neutral";
    return "rivalry";
  },

  suggestAlliance(tribeA: string, tribeB: string) {
    return {
      recommendation: "Consider cultural exchange program",
      status: this.getRelationScore(tribeA, tribeB)
    };
  }
};
