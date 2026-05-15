import { VotingService } from "./voting.service";
import { ReputationService } from "./reputation.service";

export const TribeAIv2 = {
  async recommendLeader(tribe_id: string, members: any[]) {
    const scored = await Promise.all(
      members.map(async m => ({
        user_id: m.user_id,
        score: await ReputationService.getUserScore(m.user_id)
      }))
    );

    return scored.sort((a, b) => b.score - a.score).slice(0, 3);
  },

  async interpretVote(tribe_id: string) {
    const votes = await VotingService.tallyVotes(tribe_id);

    const top = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];

    return {
      leader_candidate: top?.[0],
      confidence: top?.[1] || 0
    };
  },

  async culturalAdvice(tribe: string) {
    return {
      insight: "Increase storytelling participation to strengthen identity cohesion.",
      warning: "Low engagement may weaken tribe continuity."
    };
  }
};
