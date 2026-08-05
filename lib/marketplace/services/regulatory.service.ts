// lib/marketplace/services/regulatory.service.ts
// Regulatory Compliance Engine — KYC, AML, audit trails, tax reporting
// All marketplace transactions flow through here before settlement

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

// ─── Types ─────────────────────────────────────────────────────────

export interface KYCProfile {
  user_id: string;
  verification_level: 'none' | 'basic' | 'verified' | 'enterprise';
  id_document_url: string | null;
  proof_of_address_url: string | null;
  selfie_url: string | null;
  verified_at: string | null;
  expires_at: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  rejection_reason: string | null;
  updated_at: string;
}

export interface ComplianceRule {
  id: string;
  rule_type: 'transaction_limit' | 'velocity_limit' | 'geofence' | 'sanctions' | 'age_restriction' | 'category_block';
  name: string;
  description: string;
  enabled: boolean;
  config: Record<string, any>;
  severity: 'warn' | 'block' | 'flag';
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: 'transaction' | 'kyc' | 'listing' | 'user' | 'payout' | 'dispute';
  entity_id: string;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface TransactionLimit {
  daily_limit: number;
  weekly_limit: number;
  monthly_limit: number;
  per_transaction_limit: number;
  currency: string;
}

export interface SanctionsCheck {
  user_id: string;
  full_name: string;
  id_number: string | null;
  passed: boolean;
  checked_at: string;
  provider: string;
}

// ─── Thresholds ────────────────────────────────────────────────────

const KYC_THRESHOLDS = {
  none: { daily: 0, weekly: 0, monthly: 0, perTx: 0 },
  basic: { daily: 5000, weekly: 15000, monthly: 50000, perTx: 2500 },
  verified: { daily: 50000, weekly: 150000, monthly: 500000, perTx: 25000 },
  enterprise: { daily: 500000, weekly: 1500000, monthly: 5000000, perTx: 250000 },
};

// ─── Core Service ───────────────────────────────────────────────────

class RegulatoryService {
  private static instance: RegulatoryService;
  private auditQueue: AuditLog[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  static getInstance(): RegulatoryService {
    if (!RegulatoryService.instance) {
      RegulatoryService.instance = new RegulatoryService();
    }
    return RegulatoryService.instance;
  }

  // ─── KYC Operations ──────────────────────────────────────────────

  async getKYCProfile(userId: string): Promise<KYCProfile | null> {
    const { data, error } = await supabase
      .from('kyc_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[Regulatory] getKYCProfile error:', error);
      return null;
    }

    return data as KYCProfile | null;
  }

  async submitKYC(userId: string, docs: {
    idDocument?: string;
    proofOfAddress?: string;
    selfie?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('kyc_profiles')
      .upsert({
        user_id: userId,
        id_document_url: docs.idDocument || null,
        proof_of_address_url: docs.proofOfAddress || null,
        selfie_url: docs.selfie || null,
        status: 'pending',
        verification_level: 'basic',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('[Regulatory] submitKYC error:', error);
      return { success: false, error: error.message };
    }

    await this.logAudit({
      user_id: userId,
      action: 'kyc_submitted',
      entity_type: 'kyc',
      entity_id: userId,
      metadata: { docsProvided: Object.keys(docs) },
    });

    return { success: true };
  }

  async approveKYC(userId: string, level: KYCProfile['verification_level'], adminId: string): Promise<boolean> {
    const { error } = await supabase
      .from('kyc_profiles')
      .update({
        status: 'approved',
        verification_level: level,
        verified_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('[Regulatory] approveKYC error:', error);
      return false;
    }

    await this.logAudit({
      user_id: adminId,
      action: 'kyc_approved',
      entity_type: 'kyc',
      entity_id: userId,
      metadata: { approvedLevel: level },
    });

    return true;
  }

  // ─── Transaction Limits ──────────────────────────────────────────

  async getUserLimits(userId: string): Promise<TransactionLimit> {
    const profile = await this.getKYCProfile(userId);
    const level = profile?.verification_level || 'none';
    const thresholds = KYC_THRESHOLDS[level];

    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [daySpent, weekSpent, monthSpent] = await Promise.all([
      this.getPeriodSpending(userId, dayStart),
      this.getPeriodSpending(userId, weekStart),
      this.getPeriodSpending(userId, monthStart),
    ]);

    return {
      daily_limit: thresholds.daily,
      weekly_limit: thresholds.weekly,
      monthly_limit: thresholds.monthly,
      per_transaction_limit: thresholds.perTx,
      currency: 'USD',
    };
  }

  private async getPeriodSpending(userId: string, since: string): Promise<number> {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('buyer_id', userId)
      .eq('status', 'completed')
      .gte('created_at', since);

    if (error || !data) return 0;
    return data.reduce((sum, t) => sum + (t.amount || 0), 0);
  }

  async checkTransactionAllowed(
    userId: string,
    amount: number,
    currency: string = 'USD'
  ): Promise<{ allowed: boolean; reason?: string; remainingDaily?: number }> {
    const profile = await this.getKYCProfile(userId);
    const level = profile?.verification_level || 'none';
    const thresholds = KYC_THRESHOLDS[level];

    if (amount > thresholds.perTx) {
      return {
        allowed: false,
        reason: `Transaction exceeds per-transaction limit of ${thresholds.perTx} ${currency} for verification level "${level}". Upgrade KYC to increase limits.`,
      };
    }

    const limits = await this.getUserLimits(userId);
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const daySpent = await this.getPeriodSpending(userId, dayStart);
    const remainingDaily = limits.daily_limit - daySpent;

    if (daySpent + amount > limits.daily_limit) {
      return {
        allowed: false,
        reason: `Daily limit of ${limits.daily_limit} ${currency} exceeded. Remaining: ${remainingDaily} ${currency}.`,
        remainingDaily,
      };
    }

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('buyer_id', userId)
      .gte('created_at', hourAgo);

    if (!countError && (count || 0) >= 10) {
      return {
        allowed: false,
        reason: 'Velocity limit exceeded: maximum 10 transactions per hour.',
      };
    }

    return { allowed: true, remainingDaily };
  }

  // ─── Sanctions & Screening ───────────────────────────────────────

  async runSanctionsCheck(userId: string, fullName: string, idNumber?: string): Promise<SanctionsCheck> {
    const { data: denied } = await supabase
      .from('sanctions_list')
      .select('id')
      .ilike('name', `%${fullName}%`)
      .limit(1);

    const passed = !denied || denied.length === 0;

    const result: SanctionsCheck = {
      user_id: userId,
      full_name: fullName,
      id_number: idNumber || null,
      passed,
      checked_at: new Date().toISOString(),
      provider: 'mtaa-internal',
    };

    await supabase.from('sanctions_checks').insert(result);

    if (!passed) {
      await this.logAudit({
        user_id: userId,
        action: 'sanctions_match_flagged',
        entity_type: 'user',
        entity_id: userId,
        metadata: { fullName, idNumber, match: true },
      });
    }

    return result;
  }

  // ─── Compliance Rules Engine ─────────────────────────────────────

  async getActiveRules(): Promise<ComplianceRule[]> {
    const { data, error } = await supabase
      .from('compliance_rules')
      .select('*')
      .eq('enabled', true)
      .order('severity', { ascending: false });

    if (error) {
      console.error('[Regulatory] getActiveRules error:', error);
      return [];
    }

    return (data || []) as ComplianceRule[];
  }

  async evaluateTransaction(tx: {
    buyer_id: string;
    seller_id: string;
    amount: number;
    currency: string;
    category?: string;
    country?: string;
  }): Promise<{ passed: boolean; flags: string[]; blocked: boolean }> {
    const flags: string[] = [];
    let blocked = false;

    const rules = await this.getActiveRules();

    for (const rule of rules) {
      let triggered = false;

      switch (rule.rule_type) {
        case 'transaction_limit':
          if (tx.amount > (rule.config.max_amount || Infinity)) triggered = true;
          break;
        case 'geofence':
          if (rule.config.blocked_countries?.includes(tx.country)) triggered = true;
          break;
        case 'sanctions': {
          const check = await this.runSanctionsCheck(tx.buyer_id, tx.buyer_id, undefined);
          if (!check.passed) triggered = true;
          break;
        }
        case 'category_block':
          if (rule.config.blocked_categories?.includes(tx.category)) triggered = true;
          break;
      }

      if (triggered) {
        flags.push(`${rule.name}: ${rule.description}`);
        if (rule.severity === 'block') blocked = true;
      }
    }

    await this.logAudit({
      user_id: tx.buyer_id,
      action: 'transaction_evaluated',
      entity_type: 'transaction',
      entity_id: 'pending',
      metadata: { amount: tx.amount, flags, blocked },
    });

    return { passed: !blocked && flags.length === 0, flags, blocked };
  }

  // ─── Audit Trail ───────────────────────────────────────────────────

  async logAudit(entry: Omit<AuditLog, 'id' | 'created_at' | 'ip_address' | 'user_agent'>): Promise<void> {
    const fullEntry: Omit<AuditLog, 'id' | 'created_at'> = {
      ...entry,
      ip_address: null,
      user_agent: null,
    };

    this.auditQueue.push(fullEntry as AuditLog);

    if (this.auditQueue.length >= 10) {
      await this.flushAuditQueue();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flushAuditQueue(), 5000);
    }
  }

  private async flushAuditQueue(): Promise<void> {
    if (this.auditQueue.length === 0) return;

    const batch = [...this.auditQueue];
    this.auditQueue = [];

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const { error } = await supabase.from('audit_logs').insert(batch);
    if (error) {
      console.error('[Regulatory] flushAuditQueue error:', error);
      this.auditQueue.unshift(...batch);
    }
  }

  async getAuditTrail(filters: {
    userId?: string;
    entityType?: string;
    since?: string;
    limit?: number;
  }): Promise<AuditLog[]> {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.userId) query = query.eq('user_id', filters.userId);
    if (filters.entityType) query = query.eq('entity_type', filters.entityType);
    if (filters.since) query = query.gte('created_at', filters.since);
    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) {
      console.error('[Regulatory] getAuditTrail error:', error);
      return [];
    }
    return (data || []) as AuditLog[];
  }

  // ─── Tax Reporting ───────────────────────────────────────────────

  async generateTaxReport(userId: string, year: number): Promise<{
    totalSales: number;
    totalPurchases: number;
    totalFees: number;
    taxableAmount: number;
    currency: string;
  }> {
    const startOfYear = `${year}-01-01T00:00:00Z`;
    const endOfYear = `${year + 1}-01-01T00:00:00Z`;

    const { data: sales, error: salesError } = await supabase
      .from('transactions')
      .select('amount, platform_fee')
      .eq('seller_id', userId)
      .eq('status', 'completed')
      .gte('created_at', startOfYear)
      .lt('created_at', endOfYear);

    const { data: purchases, error: purchaseError } = await supabase
      .from('transactions')
      .select('amount, platform_fee')
      .eq('buyer_id', userId)
      .eq('status', 'completed')
      .gte('created_at', startOfYear)
      .lt('created_at', endOfYear);

    if (salesError || purchaseError) {
      console.error('[Regulatory] generateTaxReport error:', salesError || purchaseError);
      throw new Error('Failed to generate tax report');
    }

    const totalSales = (sales || []).reduce((s, t) => s + (t.amount || 0), 0);
    const totalPurchases = (purchases || []).reduce((s, t) => s + (t.amount || 0), 0);
    const totalFees = [...(sales || []), ...(purchases || [])].reduce((s, t) => s + (t.platform_fee || 0), 0);

    return {
      totalSales,
      totalPurchases,
      totalFees,
      taxableAmount: totalSales - totalFees,
      currency: 'USD',
    };
  }

  // ─── Dispute & Chargeback ────────────────────────────────────────

  async flagForReview(transactionId: string, reason: string, flaggedBy: string): Promise<boolean> {
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'under_review', review_reason: reason })
      .eq('id', transactionId);

    if (error) {
      console.error('[Regulatory] flagForReview error:', error);
      return false;
    }

    await this.logAudit({
      user_id: flaggedBy,
      action: 'transaction_flagged_for_review',
      entity_type: 'transaction',
      entity_id: transactionId,
      metadata: { reason },
    });

    return true;
  }

  // ─── Cleanup ─────────────────────────────────────────────────────

  destroy(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushAuditQueue();
    }
  }
}

export const regulatoryService = RegulatoryService.getInstance();