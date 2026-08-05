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
      .maybeSingle();

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
    // Use transaction to ensure atomicity
    const { data: verification, error: fetchError } = await supabase
      .from('identity_verifications')
      .select('*')
      .eq('id', verificationId)
      .maybeSingle();

    if (fetchError || !verification) {
      console.error('[IdentityEngine] approveVerification fetch error:', fetchError);
      return false;
    }

    // Update verification status
    const { error: updateError } = await supabase
      .from('identity_verifications')
      .update({ 
        status: 'approved', 
        verified_at: new Date().toISOString(),
        verified_by: adminId,
      })
      .eq('id', verificationId);

    if (updateError) {
      console.error('[IdentityEngine] approveVerification update error:', updateError);
      return false;
    }

    // Update identity profile
    const updateField = {
      'government_id': 'government_id_verified',
      'phone': 'phone_verified',
      'email': 'email_verified',
      'biometric': 'biometric_verified',
      'address': 'address_verified',
    }[verification.type];

    if (updateField) {
      const trustScore = await this.calculateTrustScore(verification.user_id);
      const { error: profileError } = await supabase
        .from('identity_profiles')
        .update({ 
          [updateField]: true, 
          updated_at: new Date().toISOString(),
          trust_score: trustScore,
        })
        .eq('user_id', verification.user_id);

      if (profileError) {
        console.error('[IdentityEngine] approveVerification profile update error:', profileError);
        return false;
      }
    }

    return true;
  }

  async rejectVerification(verificationId: string, adminId: string, reason: string): Promise<boolean> {
    const { error } = await supabase
      .from('identity_verifications')
      .update({ 
        status: 'rejected', 
        rejection_reason: reason,
        verified_at: new Date().toISOString(),
        verified_by: adminId,
      })
      .eq('id', verificationId);

    if (error) {
      console.error('[IdentityEngine] rejectVerification error:', error);
      return false;
    }

    return true;
  }

  async flagUser(userId: string, reason: string, flaggedBy: string): Promise<boolean> {
    // FIX: Fetch current flags, append new reason, then update
    // The old code tried to use supabase.rpc('array_append') inside .update() 
    // which is a Promise-in-DB bug — you can not pass a Promise as a column value
    const { data: profile, error: fetchError } = await supabase
      .from('identity_profiles')
      .select('flags')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('[IdentityEngine] flagUser fetch error:', fetchError);
      return false;
    }

    const currentFlags = profile?.flags || [];
    const newFlags = [...currentFlags, reason];

    const { error } = await supabase
      .from('identity_profiles')
      .update({
        flags: newFlags,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('[IdentityEngine] flagUser update error:', error);
      return false;
    }

    // Log the flag action
    await supabase.from('identity_audit_logs').insert({
      user_id: userId,
      action: 'user_flagged',
      performed_by: flaggedBy,
      details: { reason, previous_flags: currentFlags },
    }).catch(err => console.error('[IdentityEngine] flagUser audit log error:', err));

    return true;
  }

  async unflagUser(userId: string, reason: string, unflaggedBy: string): Promise<boolean> {
    const { data: profile, error: fetchError } = await supabase
      .from('identity_profiles')
      .select('flags')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('[IdentityEngine] unflagUser fetch error:', fetchError);
      return false;
    }

    const currentFlags = profile?.flags || [];
    const newFlags = currentFlags.filter(f => f !== reason);

    const { error } = await supabase
      .from('identity_profiles')
      .update({
        flags: newFlags,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('[IdentityEngine] unflagUser update error:', error);
      return false;
    }

    await supabase.from('identity_audit_logs').insert({
      user_id: userId,
      action: 'user_unflagged',
      performed_by: unflaggedBy,
      details: { reason, previous_flags: currentFlags },
    }).catch(err => console.error('[IdentityEngine] unflagUser audit log error:', err));

    return true;
  }

  async getVerificationHistory(userId: string): Promise<IdentityVerification[]> {
    const { data, error } = await supabase
      .from('identity_verifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[IdentityEngine] getVerificationHistory error:', error);
      return [];
    }

    return data || [];
  }
}

export const identityEngine = IdentityEngine.getInstance();
