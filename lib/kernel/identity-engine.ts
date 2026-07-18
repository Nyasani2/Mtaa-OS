// lib/kernel/identity.ts
// Kernel Identity Engine — user identity, verification, trust score
//
// NOTE: not the same thing as lib/kernel/auth/identity.ts (renamed to
// `currentUserSession` on 2026-07-17 to avoid a naming collision — that
// file is a lightweight current-user cache, unrelated to KYC/verification).

import { supabase } from '@/lib/supabase';

// ─── Types ─────────────────────────────────────────────────────────

export interface IdentityProfile {
  user_id: string;
  trust_score: number;
  verification_level: 'none' | 'basic' | 'verified' | 'enterprise';
  government_id_verified: boolean;
  phone_verified: boolean;
  email_verified: boolean;
  biometric_verified: boolean;
  address_verified: boolean;
  reputation_score: number;
  flags: string[];
  created_at: string;
  updated_at: string;
}

export interface IdentityVerification {
  id: string;
  user_id: string;
  type: 'government_id' | 'phone' | 'email' | 'biometric' | 'address';
  status: 'pending' | 'approved' | 'rejected';
  document_url: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

// ─── Service ───────────────────────────────────────────────────────

class IdentityEngine {
  private static instance: IdentityEngine;

  static getInstance(): IdentityEngine {
    if (!IdentityEngine.instance) {
      IdentityEngine.instance = new IdentityEngine();
    }
    return IdentityEngine.instance;
  }

  async getIdentity(userId: string): Promise<IdentityProfile | null> {
    const { data, error } = await supabase
      .from('identity_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[IdentityEngine] getIdentity error:', error);
      return null;
    }

    return data as IdentityProfile | null;
  }

  async calculateTrustScore(userId: string): Promise<number> {
    const identity = await this.getIdentity(userId);
    if (!identity) return 0;

    let score = 0;
    if (identity.email_verified) score += 10;
    if (identity.phone_verified) score += 15;
    if (identity.government_id_verified) score += 30;
    if (identity.biometric_verified) score += 25;
    if (identity.address_verified) score += 20;

    // Reputation modifier
    score += Math.min(identity.reputation_score || 0, 100) * 0.1;

    return Math.min(score, 100);
  }

  async verifyDocument(userId: string, type: IdentityVerification['type'], documentUrl: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('identity_verifications')
      .insert({
        user_id: userId,
        type,
        document_url: documentUrl,
        status: 'pending',
      });

    if (error) {
      console.error('[IdentityEngine] verifyDocument error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  async approveVerification(verificationId: string, adminId: string): Promise<boolean> {
    const { data: verification, error: fetchError } = await supabase
      .from('identity_verifications')
      .select('*')
      .eq('id', verificationId)
      .single();

    if (fetchError || !verification) return false;

    const { error } = await supabase
      .from('identity_verifications')
      .update({ status: 'approved', verified_at: new Date().toISOString() })
      .eq('id', verificationId);

    if (error) return false;

    // Update identity profile
    const updateField = {
      'government_id': 'government_id_verified',
      'phone': 'phone_verified',
      'email': 'email_verified',
      'biometric': 'biometric_verified',
      'address': 'address_verified',
    }[verification.type];

    if (updateField) {
      await supabase
        .from('identity_profiles')
        .update({ [updateField]: true, updated_at: new Date().toISOString() })
        .eq('user_id', verification.user_id);
    }

    return true;
  }

  async flagUser(userId: string, reason: string, flaggedBy: string): Promise<boolean> {
    const { error } = await supabase
      .from('identity_profiles')
      .update({
        flags: supabase.rpc('array_append', { arr: [reason] }),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('[IdentityEngine] flagUser error:', error);
      return false;
    }

    return true;
  }
}

export const identityEngine = IdentityEngine.getInstance();
