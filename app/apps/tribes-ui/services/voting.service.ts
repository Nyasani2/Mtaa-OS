import { supabase } from "@/lib/supabase";

export const VotingService = {
  async voteLeader(tribe_id: string, user_id: string, candidate_id: string) {
    return supabase.from("tribe_votes").insert({
      tribe_id,
      voter_id: user_id,
      candidate_id
    });
  },

  async getVotes(tribe_id: string) {
    return supabase
      .from("tribe_votes")
      .select("*")
      .eq("tribe_id", tribe_id);
  },

  async tallyVotes(tribe_id: string) {
    const { data } = await this.getVotes(tribe_id);

    const result: Record<string, number> = {};

    (data || []).forEach(v => {
      result[v.candidate_id] = (result[v.candidate_id] || 0) + 1;
    });

    return result;
  }
};
