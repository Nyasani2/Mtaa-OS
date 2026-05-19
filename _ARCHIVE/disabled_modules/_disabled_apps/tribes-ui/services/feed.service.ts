import { supabase } from "@/lib/supabase";

export const TribeFeedService = {
  async getFeed(tribe_id: string) {
    return supabase
      .from("tribe_feed")
      .select("*")
      .eq("tribe_id", tribe_id)
      .order("created_at", { ascending: false });
  },

  async createPost(tribe_id: string, user_id: string, content: string) {
    return supabase.from("tribe_feed").insert({
      tribe_id,
      user_id,
      content
    });
  }
};
