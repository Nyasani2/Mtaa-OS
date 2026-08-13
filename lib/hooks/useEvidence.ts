import { useState, useCallback } from 'react';
import {
  createEvidence,
  getEvidence,
  getEvidenceById,
  lockEvidence,
  unlockEvidence,
  reviewEvidence,
  linkEvidenceToCase,
  generateShareToken,
  revokeShareToken,
  incrementDownloadCount,
  deleteEvidence,
  EVIDENCE_TYPES,
  type Evidence,
} from '@/lib/services/evidence.service';

export interface UseEvidenceState {
  evidence: Evidence[];
  currentEvidence: Evidence | null;
  isLoading: boolean;
  error: string | null;
}

export function useEvidence() {
  const [state, setState] = useState<UseEvidenceState>({
    evidence: [],
    currentEvidence: null,
    isLoading: false,
    error: null,
  });

  const loadEvidence = useCallback(async (filters?: Parameters<typeof getEvidence>[0]) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getEvidence(filters);
      setState(prev => ({ ...prev, evidence: data, isLoading: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  }, []);

  const loadEvidenceItem = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getEvidenceById(id);
      setState(prev => ({ ...prev, currentEvidence: data, isLoading: false }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      return null;
    }
  }, []);

  const createNewEvidence = useCallback(async (evidenceData: Omit<Evidence, 'id' | 'created_at' | 'updated_at' | 'download_count'>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await createEvidence(evidenceData);
      setState(prev => ({
        ...prev,
        evidence: [data, ...prev.evidence],
        currentEvidence: data,
        isLoading: false,
      }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      return null;
    }
  }, []);

  const lock = useCallback(async (id: string, reason: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await lockEvidence(id, reason);
      setState(prev => ({
        ...prev,
        evidence: prev.evidence.map((e: any) => e.id === id ? data : e),
        currentEvidence: prev.currentEvidence?.id === id ? data : prev.currentEvidence,
        isLoading: false,
      }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      return null;
    }
  }, []);

  const unlock = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await unlockEvidence(id);
      setState(prev => ({
        ...prev,
        evidence: prev.evidence.map((e: any) => e.id === id ? data : e),
        currentEvidence: prev.currentEvidence?.id === id ? data : prev.currentEvidence,
        isLoading: false,
      }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      return null;
    }
  }, []);

  const review = useCallback(async (id: string, notes: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await reviewEvidence(id, notes);
      setState(prev => ({
        ...prev,
        evidence: prev.evidence.map((e: any) => e.id === id ? data : e),
        currentEvidence: prev.currentEvidence?.id === id ? data : prev.currentEvidence,
        isLoading: false,
      }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      return null;
    }
  }, []);

  const linkToCase = useCallback(async (id: string, caseData: { case_number?: string; incident_id?: string; police_report_id?: string; insurance_claim_id?: string }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await linkEvidenceToCase(id, caseData);
      setState(prev => ({
        ...prev,
        evidence: prev.evidence.map((e: any) => e.id === id ? data : e),
        currentEvidence: prev.currentEvidence?.id === id ? data : prev.currentEvidence,
        isLoading: false,
      }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      return null;
    }
  }, []);

  const share = useCallback(async (id: string, expiresInHours: number = 24) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await generateShareToken(id, expiresInHours);
      setState(prev => ({
        ...prev,
        evidence: prev.evidence.map((e: any) => e.id === id ? result.evidence : e),
        currentEvidence: prev.currentEvidence?.id === id ? result.evidence : prev.currentEvidence,
        isLoading: false,
      }));
      return result;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      return null;
    }
  }, []);

  const revokeShare = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await revokeShareToken(id);
      setState(prev => ({
        ...prev,
        evidence: prev.evidence.map((e: any) => e.id === id ? data : e),
        currentEvidence: prev.currentEvidence?.id === id ? data : prev.currentEvidence,
        isLoading: false,
      }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      return null;
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await deleteEvidence(id);
      setState(prev => ({
        ...prev,
        evidence: prev.evidence.filter((e: any) => e.id !== id),
        currentEvidence: prev.currentEvidence?.id === id ? null : prev.currentEvidence,
        isLoading: false,
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    evidenceTypes: EVIDENCE_TYPES,
    loadEvidence,
    loadEvidenceItem,
    createNewEvidence,
    lock,
    unlock,
    review,
    linkToCase,
    share,
    revokeShare,
    remove,
    clearError,
  };
}
