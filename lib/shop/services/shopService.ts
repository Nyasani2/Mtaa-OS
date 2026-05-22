import { supabase } from "@/lib/supabase/client";

export class ShopService {
  static async list(): Promise<any[]> {
    const { data } = await supabase.from("shops").select("*");
    return data || [];
  }
}

export default ShopService;
