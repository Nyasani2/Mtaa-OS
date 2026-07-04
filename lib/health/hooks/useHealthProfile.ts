import { useState, useEffect, useCallback } from 'react';
import { HealthProfile, ChildHealthProfile, InsurancePolicy, EmergencyContact } from '../types';
import {
  getHealthProfile,
  createHealthProfile,
  updateHealthProfile,
  addInsurancePolicy,
  removeInsurancePolicy,
  getChildren,
  addChild,
  updateChild,
  transferChildOwnership,
} from '../services/health-profile.service';

export function useHealthProfile(mtaaId: string) {
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [children, setChildren] = useState<ChildHealthProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mtaaId) load();
  }, [mtaaId]);

  async function load() {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([getHealthProfile(mtaaId), getChildren(mtaaId)]);
      setProfile(p);
      setChildren(c);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const create = useCallback(async (data: Omit<HealthProfile, 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      const p = await createHealthProfile(data);
      if (p) setProfile(p);
      return p;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (updates: Partial<HealthProfile>) => {
    setLoading(true);
    try {
      const p = await updateHealthProfile(mtaaId, updates);
      if (p) setProfile(p);
      return p;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [mtaaId]);

  const addInsurance = useCallback(async (policy: Omit<InsurancePolicy, 'id'>) => {
    const p = await addInsurancePolicy(mtaaId, policy);
    await load();
    return p;
  }, [mtaaId]);

  const removeInsurance = useCallback(async (policyId: string) => {
    const ok = await removeInsurancePolicy(mtaaId, policyId);
    if (ok) await load();
    return ok;
  }, [mtaaId]);

  const addChildProfile = useCallback(async (child: Omit<ChildHealthProfile, 'id' | 'parentMtaaId' | 'createdAt' | 'updatedAt'>) => {
    const c = await addChild(mtaaId, child);
    if (c) setChildren(prev => [c, ...prev]);
    return c;
  }, [mtaaId]);

  const updateChildProfile = useCallback(async (childId: string, updates: Partial<ChildHealthProfile>) => {
    const c = await updateChild(childId, updates);
    if (c) setChildren(prev => prev.map(ch => ch.id === childId ? c : ch));
    return c;
  }, []);

  const transferChild = useCallback(async (childId: string, newMtaaId: string) => {
    const ok = await transferChildOwnership(childId, newMtaaId);
    if (ok) setChildren(prev => prev.filter(c => c.id !== childId));
    return ok;
  }, []);

  const getChildAge = useCallback((child: ChildHealthProfile): number => {
    const birth = new Date(child.dateOfBirth);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  }, []);

  const isTransferReady = useCallback((child: ChildHealthProfile): boolean => {
    return getChildAge(child) >= 16;
  }, [getChildAge]);

  return {
    profile,
    children,
    loading,
    error,
    refresh: load,
    create,
    update,
    addInsurance,
    removeInsurance,
    addChildProfile,
    updateChildProfile,
    transferChild,
    getChildAge,
    isTransferReady,
  };
}
