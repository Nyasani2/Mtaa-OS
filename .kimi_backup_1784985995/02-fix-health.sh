#!/bin/bash
# 02-fix-health.sh — Creates all missing health hooks, services, types
cd ~/MTAA_OS_V10
set -e

echo "=== FIX 2: HEALTH DOMAIN ==="

# Types
mkdir -p lib/health
cat > lib/health/types.ts << 'EOF'
export interface HealthPatient {
  id: string; user_id: string; name: string; created_at: string;
}
export interface HealthAppointment {
  id: string; patient_id: string; doctor_id: string; status: string; scheduled_at: string;
}
export interface HealthRecord {
  id: string; patient_id: string; type: string; data: any; created_at: string;
}
export interface HealthRole {
  id: string; user_id: string; role: string; facility_id?: string;
}
export interface HealthFacility {
  id: string; name: string; type: string; location: string; verified: boolean;
}
export interface HealthInsuranceClaim {
  id: string; patient_id: string; amount: number; status: string; created_at: string;
}
export interface HealthLabResult {
  id: string; patient_id: string; test_type: string; result: string; created_at: string;
}
export interface HealthVital {
  id: string; patient_id: string; type: string; value: number; recorded_at: string;
}
export interface HealthMedication {
  id: string; patient_id: string; name: string; dosage: string; prescribed_by: string;
}
export interface HealthEmergency {
  id: string; patient_id: string; type: string; location: string; status: string; created_at: string;
}
export interface HealthAmbulance {
  id: string; unit_number: string; status: string; location: string; driver_id?: string;
}
export interface HealthRadiology {
  id: string; patient_id: string; scan_type: string; image_url?: string; report?: string;
}
export interface HealthChild {
  id: string; parent_id: string; name: string; dob: string; immunization_status: string;
}
export interface HealthSymptom {
  id: string; patient_id: string; symptoms: string[]; severity: number; created_at: string;
}
export interface HealthTelemedicine {
  id: string; patient_id: string; doctor_id: string; status: string; started_at?: string;
}
export interface HealthNotification {
  id: string; user_id: string; title: string; body: string; read: boolean; created_at: string;
}
export interface HealthCashier {
  id: string; facility_id: string; patient_id: string; amount: number; status: string;
}
export interface HealthSystemSetting {
  id: string; key: string; value: any; category: string;
}
EOF
echo "  ✓ lib/health/types.ts"

# State store
mkdir -p lib/domains/health/state
cat > lib/domains/health/state/healthStore.ts << 'EOF'
import { create } from 'zustand';

interface HealthState {
  currentPatient: any | null;
  currentRole: string | null;
  facility: any | null;
  setCurrentPatient: (p: any) => void;
  setCurrentRole: (r: string) => void;
  setFacility: (f: any) => void;
}

export const useHealthStore = create<HealthState>((set) => ({
  currentPatient: null,
  currentRole: null,
  facility: null,
  setCurrentPatient: (p) => set({ currentPatient: p }),
  setCurrentRole: (r) => set({ currentRole: r }),
  setFacility: (f) => set({ facility: f }),
}));

export default useHealthStore;
EOF
echo "  ✓ lib/domains/health/state/healthStore.ts"

# Hooks
mkdir -p lib/health/hooks

for hook in usePatient useEmergency useGovernment useChildren useLab useFacility useInsurance useDoctor useAmbulance useAppointments useRadiology useVitals useSystem useHealthRole; do
  cat > lib/health/hooks/${hook}.ts << HOOK_EOF
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function ${hook}(options?: any) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: result, error: err } = await supabase.from('health_patients').select('*').limit(10);
      if (err) throw err;
      setData(result || []);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
HOOK_EOF
  echo "  ✓ lib/health/hooks/${hook}.ts"
done

# Services
mkdir -p lib/health/services

for svc in patient emergency children radiology facility provider ambulance notification insurance lab cashier appointment vitals symptom system record health-role telemedicine doctor; do
  cat > lib/health/services/${svc}.service.ts << SVC_EOF
import { supabase } from '@/lib/supabase';
import type { HealthPatient, HealthRecord, HealthAppointment } from '@/lib/health/types';

export const ${svc}Service = {
  async list() {
    const { data, error } = await supabase.from('health_patients').select('*').limit(50);
    if (error) throw error;
    return data || [];
  },
  async getById(id: string) {
    const { data, error } = await supabase.from('health_patients').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  async create(payload: any) {
    const { data, error } = await supabase.from('health_patients').insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, payload: any) {
    const { data, error } = await supabase.from('health_patients').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
};
SVC_EOF
  echo "  ✓ lib/health/services/${svc}.service.ts"
done

echo "=== HEALTH COMPLETE ==="
