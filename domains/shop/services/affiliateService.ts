// lib/shop/services/affiliateService.ts
import { supabase } from "@/lib/supabase/client";
import { AffiliateProgram, ShopAffiliate } from "../types";

export class AffiliateService {
  static async getProgram(shopId: string): Promise<AffiliateProgram | null> {
    const { data, error } = await supabase.from("shop_affiliate_programs").select("*").eq("shop_id", shopId).single();
    if (error) return null;
    return data;
  }

  static async createProgram(program: Partial<AffiliateProgram>): Promise<AffiliateProgram> {
    const { data, error } = await supabase.from("shop_affiliate_programs").insert(program).select().single();
    if (error) throw error;
    return data;
  }

  static async updateProgram(shopId: string, updates: Partial<AffiliateProgram>): Promise<AffiliateProgram> {
    const { data, error } = await supabase.from("shop_affiliate_programs").update(updates).eq("shop_id", shopId).select().single();
    if (error) throw error;
    return data;
  }

  static async joinAffiliateProgram(shopId: string): Promise<ShopAffiliate> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error("Not authenticated");

    const referralCode = `AFF-${shopId.slice(0, 8)}-${user.id.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabase.from("shop_affiliates").insert({
      shop_id: shopId,
      user_id: user.id,
      referral_code: referralCode,
      referral_link: `${window.location.origin}/shop/${shopId}?ref=${referralCode}`,
      status: "pending",
    }).select().single();

    if (error) throw error;
    return data;
  }

  static async getMyAffiliates(): Promise<ShopAffiliate[]> {
    const { data, error } = await supabase.from("shop_affiliates").select("*, shop:shop_id(name, logo_url)").eq("user_id", (await supabase.auth.getUser()).data.user?.id);
    if (error) throw error;
    return data || [];
  }

  static async getAffiliateStats(affiliateId: string): Promise<any> {
    const { data: conversions } = await supabase.from("shop_affiliate_conversions").select("*").eq("affiliate_id", affiliateId);
    const { data: affiliate } = await supabase.from("shop_affiliates").select("*").eq("id", affiliateId).single();

    return {
      total_clicks: affiliate?.total_clicks || 0,
      total_conversions: affiliate?.total_conversions || 0,
      total_earnings: affiliate?.total_earnings || 0,
      balance: affiliate?.balance || 0,
      conversion_rate: affiliate?.total_clicks > 0 ? ((affiliate.total_conversions / affiliate.total_clicks) * 100).toFixed(2) : 0,
      pending_commissions: conversions?.filter(c => c.status === "pending").reduce((s, c) => s + c.commission_amount, 0) || 0,
      paid_commissions: conversions?.filter(c => c.status === "paid").reduce((s, c) => s + c.commission_amount, 0) || 0,
    };
  }

  static async requestPayout(affiliateId: string, amount: number): Promise<void> {
    const { data: affiliate } = await supabase.from("shop_affiliates").select("balance, program:shop_affiliate_programs(min_payout_amount, payout_method)").eq("id", affiliateId).single();
    if (!affiliate) throw new Error("Affiliate not found");
    if (amount > affiliate.balance) throw new Error("Insufficient balance");
    if (amount < (affiliate.program?.min_payout_amount || 0)) throw new Error(`Minimum payout is ${affiliate.program?.min_payout_amount}`);

    // Create payout transaction
    await supabase.from("shop_affiliates").update({
      balance: affiliate.balance - amount,
      total_paid: (affiliate.total_paid || 0) + amount,
    }).eq("id", affiliateId);

    // TODO: Integrate with wallet/payment system for actual payout
  }
}
