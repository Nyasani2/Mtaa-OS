import { supabase } from "@/lib/supabase/client";

export class AccountingService {
  static async list(): Promise<any[]> {
    const { data } = await supabase.from("accountings").select("*");
    return data || [];
  }
}

export default AccountingService;
