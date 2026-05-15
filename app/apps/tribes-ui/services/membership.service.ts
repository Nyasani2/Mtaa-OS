import { supabase } from "@/lib/supabase";

export const MembershipService = {
  async joinTribe(tribe_id: string, user_id: string) {
    return supabase.from("tribe_members").insert({
      tribe_id,
      user_id,
      role: "member"
    });
  },

  async leaveTribe(tribe_id: string, user_id: string) {
    return supabase
      .from("tribe_members")
      .delete()
      .eq("tribe_id", tribe_id)
      .eq("user_id", user_id);
  },

  async getMembers(tribe_id: string) {
    return supabase
      .from("tribe_members")
      .select("*")
      .eq("tribe_id", tribe_id);
  }
};
