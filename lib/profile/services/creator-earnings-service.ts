// ============================================================================
// MTAA Creator Earnings Service
// Aggregates all revenue streams and routes to Treasury
// ============================================================================

import { supabase } from '@/lib/supabase';
import type { CreatorEarning, CreatorEarningSummary, CreatorWithdrawal } from './types';

export class CreatorEarningsService {
  // ── Record a new earning from any module ─────────────────────────────────
  static async recordEarning(params: {
    userId: string;
    profileId: string;
    sourceType: string;
    sourceId?: string;
    sourceModule: string;
    grossAmount: number;
    platformFeeRate?: number; // e.g., 0.10 for 10%
    taxRate?: number; // e.g., 0.05 for 5%
    processingFee?: number;
    currency?: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<{ data: CreatorEarning | null; error: any }> {
    const {
      userId, profileId, sourceType, sourceId, sourceModule,
      grossAmount, platformFeeRate = 0.10, taxRate = 0.05,
      processingFee = 0, currency = 'KES', description, metadata
    } = params;

    const platformFee = grossAmount * platformFeeRate;
    const taxWithheld = grossAmount * taxRate;

    const { data, error } = await supabase
      .from('creator_earnings')
      .insert({
        user_id: userId,
        profile_id: profileId,
        source_type: sourceType,
        source_id: sourceId,
        source_module: sourceModule,
        gross_amount: grossAmount,
        platform_fee: platformFee,
        tax_withheld: taxWithheld,
        processing_fee: processingFee,
        currency,
        description,
        metadata,
        status: 'pending',
      })
      .select()
      .maybeSingle();

    return { data, error };
  }

  // ── Get earnings summary for dashboard ───────────────────────────────────
  static async getEarningsSummary(userId: string): Promise<CreatorEarningSummary | null> {
    const { data, error } = await supabase
      .rpc('get_creator_earnings_summary', { p_user_id: userId });

    if (error) {
      console.error('getEarningsSummary error:', error);
      return null;
    }

    if (!data || data.length === 0) return null;

    const row = data[0];
    return {
      totalGross: parseFloat(row.total_gross) || 0,
      totalNet: parseFloat(row.total_net) || 0,
      availableBalance: parseFloat(row.available_balance) || 0,
      totalWithdrawn: parseFloat(row.total_withdrawn) || 0,
      pendingCount: parseInt(row.pending_count) || 0,
      availableCount: parseInt(row.available_count) || 0,
      withdrawnCount: parseInt(row.withdrawn_count) || 0,
      lastEarningAt: row.last_earning_at,
      earningsByModule: row.earnings_by_module || {},
    };
  }

  // ── Get detailed earnings list ───────────────────────────────────────────
  static async getEarnings(userId: string, options?: {
    status?: string;
    sourceModule?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: CreatorEarning[]; count: number }> {
    let query = supabase
      .from('creator_earnings')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.status) query = query.eq('status', options.status);
    if (options?.sourceModule) query = query.eq('source_module', options.sourceModule);
    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 20) - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }

  // ── Request withdrawal ───────────────────────────────────────────────────
  static async requestWithdrawal(params: {
    userId: string;
    profileId: string;
    amount: number;
    destinationType: 'wallet' | 'bank' | 'mobile_money' | 'crypto';
    destinationDetails: Record<string, any>;
  }): Promise<{ data: CreatorWithdrawal | null; error: any }> {
    const { userId, profileId, amount, destinationType, destinationDetails } = params;

    // Check available balance
    const summary = await this.getEarningsSummary(userId);
    if (!summary || summary.availableBalance < amount) {
      return { data: null, error: new Error('Insufficient available balance') };
    }

    const fee = amount * 0.02; // 2% withdrawal fee
    const netAmount = amount - fee;

    const { data, error } = await supabase
      .from('creator_withdrawals')
      .insert({
        user_id: userId,
        profile_id: profileId,
        amount,
        fee,
        net_amount: netAmount,
        destination_type: destinationType,
        destination_details: destinationDetails,
        status: 'pending',
      })
      .select()
      .maybeSingle();

    if (error) return { data: null, error };

    // Mark earnings as withdrawn
    await supabase
      .from('creator_earnings')
      .update({ status: 'withdrawn', withdrawn_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'available')
      .order('created_at', { ascending: true })
      .limit(100); // Mark up to 100 records

    return { data, error: null };
  }

  // ── Get withdrawals ──────────────────────────────────────────────────────
  static async getWithdrawals(userId: string): Promise<CreatorWithdrawal[]> {
    const { data, error } = await supabase
      .from('creator_withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ── Module-specific helpers ──────────────────────────────────────────────

  // Streets: Record a tip
  static async recordStreetsTip(tipperId: string, creatorId: string, amount: number, postId?: string) {
    const { data: profile } = await supabase.from('user_profiles').select('id').eq('user_id', creatorId).maybeSingle();
    if (!profile) return { data: null, error: new Error('Creator profile not found') };

    return this.recordEarning({
      userId: creatorId,
      profileId: profile.id,
      sourceType: 'streets_tip',
      sourceId: postId,
      sourceModule: 'streets',
      grossAmount: amount,
      platformFeeRate: 0.10,
      taxRate: 0.05,
      description: `Tip from user ${tipperId}`,
    });
  }

  // Streets: Record a subscription
  static async recordStreetsSubscription(subscriberId: string, creatorId: string, amount: number) {
    const { data: profile } = await supabase.from('user_profiles').select('id').eq('user_id', creatorId).maybeSingle();
    if (!profile) return { data: null, error: new Error('Creator profile not found') };

    return this.recordEarning({
      userId: creatorId,
      profileId: profile.id,
      sourceType: 'streets_subscription',
      sourceModule: 'streets',
      grossAmount: amount,
      platformFeeRate: 0.15,
      taxRate: 0.05,
      description: `Subscription from user ${subscriberId}`,
    });
  }

  // MTaxi: Record driver earnings
  static async recordMtaxiEarning(driverId: string, amount: number, tripId: string) {
    const { data: profile } = await supabase.from('user_profiles').select('id').eq('user_id', driverId).maybeSingle();
    if (!profile) return { data: null, error: new Error('Driver profile not found') };

    return this.recordEarning({
      userId: driverId,
      profileId: profile.id,
      sourceType: 'mtaxi_fare',
      sourceId: tripId,
      sourceModule: 'mtaxi',
      grossAmount: amount,
      platformFeeRate: 0.20,
      taxRate: 0.05,
      description: `Trip fare ${tripId}`,
    });
  }

  // Shop: Record a sale
  static async recordShopSale(sellerId: string, amount: number, orderId: string) {
    const { data: profile } = await supabase.from('user_profiles').select('id').eq('user_id', sellerId).maybeSingle();
    if (!profile) return { data: null, error: new Error('Seller profile not found') };

    return this.recordEarning({
      userId: sellerId,
      profileId: profile.id,
      sourceType: 'shop_sale',
      sourceId: orderId,
      sourceModule: 'shop',
      grossAmount: amount,
      platformFeeRate: 0.05,
      taxRate: 0.05,
      description: `Shop sale ${orderId}`,
    });
  }

  // Marketplace: Record a sale
  static async recordMarketplaceSale(sellerId: string, amount: number, orderId: string) {
    const { data: profile } = await supabase.from('user_profiles').select('id').eq('user_id', sellerId).maybeSingle();
    if (!profile) return { data: null, error: new Error('Seller profile not found') };

    return this.recordEarning({
      userId: sellerId,
      profileId: profile.id,
      sourceType: 'marketplace_sale',
      sourceId: orderId,
      sourceModule: 'marketplace',
      grossAmount: amount,
      platformFeeRate: 0.08,
      taxRate: 0.05,
      description: `Marketplace sale ${orderId}`,
    });
  }

  // Jobs: Record freelance payment
  static async recordJobPayment(workerId: string, amount: number, jobId: string) {
    const { data: profile } = await supabase.from('user_profiles').select('id').eq('user_id', workerId).maybeSingle();
    if (!profile) return { data: null, error: new Error('Worker profile not found') };

    return this.recordEarning({
      userId: workerId,
      profileId: profile.id,
      sourceType: 'job_freelance',
      sourceId: jobId,
      sourceModule: 'jobs',
      grossAmount: amount,
      platformFeeRate: 0.10,
      taxRate: 0.05,
      description: `Job payment ${jobId}`,
    });
  }

  // Property: Record rental income
  static async recordPropertyRental(ownerId: string, amount: number, bookingId: string) {
    const { data: profile } = await supabase.from('user_profiles').select('id').eq('user_id', ownerId).maybeSingle();
    if (!profile) return { data: null, error: new Error('Owner profile not found') };

    return this.recordEarning({
      userId: ownerId,
      profileId: profile.id,
      sourceType: 'property_rental',
      sourceId: bookingId,
      sourceModule: 'property',
      grossAmount: amount,
      platformFeeRate: 0.05,
      taxRate: 0.05,
      description: `Property rental ${bookingId}`,
    });
  }

  // Restaurant: Record order income
  static async recordRestaurantOrder(ownerId: string, amount: number, orderId: string) {
    const { data: profile } = await supabase.from('user_profiles').select('id').eq('user_id', ownerId).maybeSingle();
    if (!profile) return { data: null, error: new Error('Owner profile not found') };

    return this.recordEarning({
      userId: ownerId,
      profileId: profile.id,
      sourceType: 'restaurant_order',
      sourceId: orderId,
      sourceModule: 'restaurant',
      grossAmount: amount,
      platformFeeRate: 0.08,
      taxRate: 0.05,
      description: `Restaurant order ${orderId}`,
    });
  }

  // Education: Record course sale
  static async recordCourseSale(teacherId: string, amount: number, courseId: string) {
    const { data: profile } = await supabase.from('user_profiles').select('id').eq('user_id', teacherId).maybeSingle();
    if (!profile) return { data: null, error: new Error('Teacher profile not found') };

    return this.recordEarning({
      userId: teacherId,
      profileId: profile.id,
      sourceType: 'education_course',
      sourceId: courseId,
      sourceModule: 'education',
      grossAmount: amount,
      platformFeeRate: 0.15,
      taxRate: 0.05,
      description: `Course sale ${courseId}`,
    });
  }
}

export default CreatorEarningsService;
