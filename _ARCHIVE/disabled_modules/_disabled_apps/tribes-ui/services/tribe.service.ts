import { supabase } from "@/lib/supabase";

export const TribeService = {
  async listTribes() {
    return supabase.from("tribes").select("*");
  },

  async getTribe(id: string) {
    return supabase.from("tribes").select("*").eq("id", id).single();
  },

  async getMuseum() {
    return supabase.from("tribe_museum").select("*");
  }
};
