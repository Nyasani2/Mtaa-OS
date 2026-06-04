// lib/marketplace/hooks/useRegulatory.ts
// React hook for regulatory compliance — KYC, limits, audit, alerts

import { useState, useEffect, useCallback, useRef } from 'react';
import { regulatoryService, KYCProfile, TransactionLimit, AuditLog, ComplianceRule } from '@/lib/marketplace/services/regulatory.service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

interface RegulatoryState {
  kycProfile: KYCProfile | null;
  limits: TransactionLimit | null;
  auditLogs: AuditLog[];
  complianceRules: ComplianceRule[];
  loading: boolean;
  error: string | null;
  checkingTransaction: boolean;
  lastCheckResult: { allowed: boolean; reason?: string; remainingDaily?: number } | null;
}

export function useRegulatory() {
  const { user } = useAuthStore();
  const [state, setState] = useState<RegulatoryState>({
    kycProfile: null,
    limits: null,
    auditLogs: [],
    complianceRules: [],
    loading: false,
    error: null,
    checkingTransaction: false,
    lastCheckResult: null,
  });

  const mounted = useRef(true);

  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  const safeSetState = useCallback((update: Partial<RegulatoryState>) => {
    if (mounted.current) {
      setState(prev => ({ ...prev, ...update }));
    }
  }, []);

  // ─── Load KYC Profile ────────────────────────────────────────────

  const loadKYC = useCallback(async () => {
    if (!user?.id) return;
    safeSetState({ loading: true, error: null });
    try {
      const profile = await regulatoryService.getKYCProfile(user.id);
      safeSetState({ kycProfile: profile, loading: false });
    } catch (err: any) {
      safeSetState({ error: err.message || 'Failed to load KYC', loading: false });
    }
  }, [user?.id, safeSetState]);

  useEffect(() => {
    loadKYC();
  }, [loadKYC]);

  // ─── Load Limits ───────────────────────────────────────────────

  const loadLimits = useCallback(async () => {
    if (!user?.id) return;
    safeSetState({ loading: true });
    try {
      const limits = await regulatoryService.getUserLimits(user.id);
      safeSetState({ limits, loading: false });
    } catch (err: any) {
      safeSetState({ error: err.message, loading: false });
    }
  }, [user?.id, safeSetState]);

  // ─── Submit KYC ──────────────────────────────────────────────────

  const submitKYC = useCallback(async (docs: {
    idDocument?: string;
    proofOfAddress?: string;
    selfie?: string;
  }) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    safeSetState({ loading: true });
    const result = await regulatoryService.submitKYC(user.id, docs);
    if (result.success) await loadKYC();
    safeSetState({ loading: false });
    return result;
  }, [user?.id, loadKYC, safeSetState]);

  // ─── Check Transaction ───────────────────────────────────────────

  const checkTransaction = useCallback(async (amount: number, currency: string = 'USD') => {
    if (!user?.id) return { allowed: false, reason: 'Not authenticated' };
    safeSetState({ checkingTransaction: true, lastCheckResult: null });
    const result = await regulatoryService.checkTransactionAllowed(user.id, amount, currency);
    safeSetState({ checkingTransaction: false, lastCheckResult: result });
    return result;
  }, [user?.id, safeSetState]);

  // ─── Audit Trail ─────────────────────────────────────────────────

  const loadAuditLogs = useCallback(async (filters: {
    entityType?: string;
    since?: string;
    limit?: number;
  } = {}) => {
    if (!user?.id) return;
    safeSetState({ loading: true });
    try {
      const logs = await regulatoryService.getAuditTrail({
        userId: user.id,
        ...filters,
      });
      safeSetState({ auditLogs: logs, loading: false });
    } catch (err: any) {
      safeSetState({ error: err.message, loading: false });
    }
  }, [user?.id, safeSetState]);

  // ─── Compliance Rules ────────────────────────────────────────────

  const loadComplianceRules = useCallback(async () => {
    safeSetState({ loading: true });
    try {
      const rules = await regulatoryService.getActiveRules();
      safeSetState({ complianceRules: rules, loading: false });
    } catch (err: any) {
      safeSetState({ error: err.message, loading: false });
    }
  }, [safeSetState]);

  // ─── Tax Report ──────────────────────────────────────────────────

  const generateTaxReport = useCallback(async (year: number) => {
    if (!user?.id) throw new Error('Not authenticated');
    return regulatoryService.generateTaxReport(user.id, year);
  }, [user?.id]);

  // ─── Sanctions Check ─────────────────────────────────────────────

  const runSanctionsCheck = useCallback(async (fullName: string, idNumber?: string) => {
    if (!user?.id) throw new Error('Not authenticated');
    return regulatoryService.runSanctionsCheck(user.id, fullName, idNumber);
  }, [user?.id]);

  // ─── Derived State ───────────────────────────────────────────────

  const kycLevel = state.kycProfile?.verification_level || 'none';
  const kycStatus = state.kycProfile?.status || 'none';
  const isVerified = kycStatus === 'approved';
  const needsKYC = kycLevel === 'none' || kycStatus === 'rejected' || kycStatus === 'expired';

  return {
    ...state,
    kycLevel,
    kycStatus,
    isVerified,
    needsKYC,
    loadKYC,
    loadLimits,
    submitKYC,
    checkTransaction,
    loadAuditLogs,
    loadComplianceRules,
    generateTaxReport,
    runSanctionsCheck,
  };
}
