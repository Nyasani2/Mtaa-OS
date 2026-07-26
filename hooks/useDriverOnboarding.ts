import { useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export interface DriverFormData {
  fullName: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  vehicleNumber: string;
  vehicleType: string;
  vehicleModel: string;
  vehicleYear: string;
  insuranceProvider: string;
  insurancePolicy: string;
  insuranceExpiry: string;
  emergencyContact: string;
  emergencyPhone: string;
  experienceYears: string;
  cprCertified: boolean;
  firstAidCertified: boolean;
}

export function useDriverOnboarding() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submitDriverApplication = useCallback(async (formData: DriverFormData) => {
    if (!user?.id) {
      setError('Authentication required');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create health_staff record
      const { error: staffErr } = await supabase
        .from('health_staff')
        .upsert({
          user_id: user.id,
          role: 'ambulance_driver',
          is_verified: false,
          status: 'pending',
          license_number: formData.licenseNumber,
          years_experience: parseInt(formData.experienceYears) || 0,
          created_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (staffErr) throw staffErr;

      // 2. Create ambulance record
      const { error: ambErr } = await supabase
        .from('health_ambulances')
        .insert({
          driver_id: user.id,
          vehicle_number: formData.vehicleNumber,
          vehicle_type: formData.vehicleType,
          vehicle_model: formData.vehicleModel,
          vehicle_year: parseInt(formData.vehicleYear) || null,
          status: 'pending_approval',
          insurance_provider: formData.insuranceProvider,
          insurance_policy: formData.insurancePolicy,
          insurance_expiry: formData.insuranceExpiry,
          created_at: new Date().toISOString(),
        });

      if (ambErr) throw ambErr;

      // 3. Create driver detail record
      const { error: detailErr } = await supabase
        .from('health_ambulance_drivers')
        .upsert({
          user_id: user.id,
          full_name: formData.fullName,
          phone: formData.phone,
          license_number: formData.licenseNumber,
          license_expiry: formData.licenseExpiry,
          emergency_contact: formData.emergencyContact,
          emergency_phone: formData.emergencyPhone,
          cpr_certified: formData.cprCertified,
          first_aid_certified: formData.firstAidCertified,
          application_status: 'pending',
          created_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (detailErr) throw detailErr;

      setSuccess(true);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const checkApplicationStatus = useCallback(async () => {
    if (!user?.id) return null;
    try {
      const { data, error: err } = await supabase
        .from('health_ambulance_drivers')
        .select('application_status, reviewed_at, review_notes')
        .eq('user_id', user.id)
        .maybeSingle();

      if (err) throw err;
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [user?.id]);

  return {
    submitDriverApplication,
    checkApplicationStatus,
    loading,
    error,
    success,
    clearError: () => setError(null),
  };
}
