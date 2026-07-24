import { supabase } from "@/lib/supabase";

export class AffiliateService {
  static async list(): Promise<any[]> {
    const { data } = await supabase.from("affiliates").select("*");
    return data || [];
  }
}

export default AffiliateService;
