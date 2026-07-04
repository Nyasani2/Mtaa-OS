import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface HealthProfile {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth: string;
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContacts: { name: string; relationship: string; phone: string }[];
  organDonor: boolean;
  heightCm?: number;
  weightKg?: number;
  createdAt: string;
  updatedAt: string;
}

export function useHealthProfile(userId?: string) {
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('health_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error) throw error;
      if (data) setProfile(mapDb(data));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const update = useCallback(async (updates: Partial<HealthProfile>) => {
    if (!userId) return false;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('health_profiles')
        .update(mapToDb(updates))
        .eq('user_id', userId);
      if (error) throw error;
      await load();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId, load]);

  return { profile, loading, error, refresh: load, update };
}

function mapDb(row: any): HealthProfile {
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    dateOfBirth: row.date_of_birth,
    bloodGroup: row.blood_group,
    allergies: row.allergies || [],
    chronicConditions: row.chronic_conditions || [],
    emergencyContacts: row.emergency_contacts || [],
    organDonor: row.organ_donor,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapToDb(p: Partial<HealthProfile>): any {
  const db: any = {};
  if (p.fullName !== undefined) db.full_name = p.fullName;
  if (p.dateOfBirth !== undefined) db.date_of_birth = p.dateOfBirth;
  if (p.bloodGroup !== undefined) db.blood_group = p.bloodGroup;
  if (p.allergies !== undefined) db.allergies = p.allergies;
  if (p.chronicConditions !== undefined) db.chronic_conditions = p.chronicConditions;
  if (p.emergencyContacts !== undefined) db.emergency_contacts = p.emergencyContacts;
  if (p.organDonor !== undefined) db.organ_donor = p.organDonor;
  if (p.heightCm !== undefined) db.height_cm = p.heightCm;
  if (p.weightKg !== undefined) db.weight_kg = p.weightKg;
  return db;
}
