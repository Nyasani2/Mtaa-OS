import { supabase } from '@/lib/supabase';
import { AffiliateProgram, ShopAffiliate } from '../types';

export class AffiliateService {
  static async getProgram(shopId: string): Promise<AffiliateProgram | null> {
    const { data, error } = await supabase.from('affiliate_programs').select('*').eq('shop_id', shopId).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getMyAffiliates(): Promise<ShopAffiliate[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase.from('shop_affiliates').select('*').eq('affiliate_id', user.id);
    if (error) throw error;
    return data || [];
  }

  static async getAffiliateStats(affiliateId: string): Promise<{ clicks: number; conversions: number; earnings: number }> {
    const { data: clicks } = await supabase.from('affiliate_clicks').select('*').eq('affiliate_id', affiliateId);
    const { data: conversions } = await supabase.from('shop_orders').select('*').eq('affiliate_id', affiliateId);
    const earnings = (conversions || []).reduce((sum: number, o: any) => sum + (o.commission || 0), 0);
    return { clicks: (clicks || []).length, conversions: (conversions || []).length, earnings };
  }

  static async updateProgram(shopId: string, data: Partial<AffiliateProgram>): Promise<void> {
    const { error } = await supabase.from('affiliate_programs').update(data).eq('shop_id', shopId);
    if (error) throw error;
  }

  static async createProgram(data: Partial<AffiliateProgram>): Promise<AffiliateProgram> {
    const { data: result, error } = await supabase.from('affiliate_programs').insert(data).select().single();
    if (error) throw error;
    return result;
  }

  static async joinAffiliateProgram(shopId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase.from('shop_affiliates').insert({ shop_id: shopId, affiliate_id: user.id });
    if (error) throw error;
  }
}
