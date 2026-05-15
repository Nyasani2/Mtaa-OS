import { supabase } from "@/lib/supabase";

export const ReputationService = {
  async getUserScore(user_id: string) {
    const { data } = await supabase
      .from("reputation_scores")
      .select("*")
      .eq("user_id", user_id)
      .single();

    return data?.score || 0;
  },

  async adjustScore(user_id: string, delta: number) {
    const current = await this.getUserScore(user_id);

    return supabase.from("reputation_scores").upsert({
      user_id,
      score: current + delta
    });
  },

  async calculateInfluenceWeight(user_id: string) {
    const score = await this.getUserScore(user_id);

    if (score > 100) return 3;
    if (score > 50) return 2;
    return 1;
  }
};
