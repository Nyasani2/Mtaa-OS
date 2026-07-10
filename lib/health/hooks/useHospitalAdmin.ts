
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth/store/auth.store';

interface HospitalStats {
  totalBeds: number;
  occupiedBeds: number;
  totalStaff: number;
  staffOnDuty: number;
  todayAdmissions: number;
  todayRevenue: number;
}

interface Admission {
  id: string;
  patient_id: string;
  patient_name: string;
  bed_number: string;
  ward: string;
  diagnosis: string;
  doctor_name?: string;
  admission_date: string;
  status: string;
}

interface Discharge {
  id: string;
  patient_id: string;
  patient_name: string;
  bed_number: string;
  ward: string;
  diagnosis: string;
  discharge_date: string;
  discharge_type: string;
  medications?: string[];
}

interface Bed {
  id: string;
  bed_number: string;
  ward: string;
  room_type: string;
  floor: number;
  status: string;
  patient_id?: string;
  patient_name?: string;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  license_number?: string;
  status: string;
}

export function useHospitalAdmin(facilityId: string | null) {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<HospitalStats | null>(null);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [activeAdmissions, setActiveAdmissions] = useState<Admission[]>([]);
  const [discharges, setDischarges] = useState<Discharge[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffOnDuty, setStaffOnDuty] = useState<StaffMember[]>([]);
  const [recentAdmissions, setRecentAdmissions] = useState<Admission[]>([]);
  const [recentDischarges, setRecentDischarges] = useState<Discharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const fetchData = useCallback(async () => {
    if (!facilityId || !user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Stats
      const { data: bedsData } = await supabase
        .from('health_beds')
        .select('status')
        .eq('facility_id', facilityId);
      const totalBeds = bedsData?.length || 0;
      const occupiedBeds = bedsData?.filter((b: any) => b.status === 'occupied').length || 0;

      const { data: staffData } = await supabase
        .from('health_staff')
        .select('status')
        .eq('facility_id', facilityId);
      const totalStaff = staffData?.length || 0;
      const staffOnDutyCount = staffData?.filter((s: any) => s.status === 'active').length || 0;

      const { data: admData } = await supabase
        .from('health_beds')
        .select('id')
        .eq('facility_id', facilityId)
        .gte('admission_date', today);
      const todayAdmissions = admData?.length || 0;

      const { data: revData } = await supabase
        .from('health_billing')
        .select('amount')
        .eq('facility_id', facilityId)
        .gte('created_at', today);
      const todayRevenue = revData?.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0;

      if (isMounted.current) {
        setStats({ totalBeds, occupiedBeds, totalStaff, staffOnDuty: staffOnDutyCount, todayAdmissions, todayRevenue });
      }

      // Beds
      const { data: bedsList } = await supabase
        .from('health_beds')
        .select('*, health_admissions!inner(patient_id, patient:patient_id(name))')
        .eq('facility_id', facilityId)
        .order('bed_number');
      const mappedBeds = (bedsList || []).map((b: any) => ({
        id: b.id,
        bed_number: b.bed_number,
        ward: b.ward,
        room_type: b.room_type,
        floor: b.floor,
        status: b.status,
        patient_id: b.health_admissions?.[0]?.patient_id,
        patient_name: b.health_admissions?.[0]?.patient?.name,
      }));
      if (isMounted.current) {
        setBeds(mappedBeds);
        setAvailableBeds(mappedBeds.filter((b: Bed) => b.status === 'available'));
      }

      // Admissions
      const { data: admissionsList } = await supabase
        .from('health_beds')
        .select('*, patient:patient_id(name), bed:bed_id(bed_number, ward), doctor:doctor_id(name)')
        .eq('facility_id', facilityId)
        .order('admission_date', { ascending: false });
      const mappedAdmissions = (admissionsList || []).map((a: any) => ({
        id: a.id,
        patient_id: a.patient_id,
        patient_name: a.patient?.name || 'Unknown',
        bed_number: a.bed?.bed_number || '',
        ward: a.bed?.ward || '',
        diagnosis: a.diagnosis || '',
        doctor_name: a.doctor?.name,
        admission_date: a.admission_date,
        status: a.status,
      }));
      if (isMounted.current) {
        setAdmissions(mappedAdmissions);
        setActiveAdmissions(mappedAdmissions.filter((a: Admission) => a.status === 'active'));
        setRecentAdmissions(mappedAdmissions.slice(0, 5));
      }

      // Discharges
      const { data: dischargesList } = await supabase
        .from('health_beds')
        .select('*, patient:patient_id(name), bed:bed_id(bed_number, ward)')
        .eq('facility_id', facilityId)
        .order('discharge_date', { ascending: false });
      const mappedDischarges = (dischargesList || []).map((d: any) => ({
        id: d.id,
        patient_id: d.patient_id,
        patient_name: d.patient?.name || 'Unknown',
        bed_number: d.bed?.bed_number || '',
        ward: d.bed?.ward || '',
        diagnosis: d.diagnosis || '',
        discharge_date: d.discharge_date,
        discharge_type: d.discharge_type,
        medications: d.medications,
      }));
      if (isMounted.current) {
        setDischarges(mappedDischarges);
        setRecentDischarges(mappedDischarges.slice(0, 5));
      }

      // Staff
      const { data: staffList } = await supabase
        .from('health_staff')
        .select('*')
        .eq('facility_id', facilityId)
        .order('name');
      if (isMounted.current) {
        setStaff(staffList || []);
        setStaffOnDuty((staffList || []).filter((s: StaffMember) => s.status === 'active').slice(0, 5));
      }
    } catch (err: any) {
      if (isMounted.current) setError(err.message || 'Failed to load hospital data');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [facilityId, user?.id]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    return () => { isMounted.current = false; };
  }, [fetchData]);

  const addBed = useCallback(async (bedData: any) => {
    const { error } = await supabase.from('health_beds').insert(bedData);
    if (error) throw error;
    await fetchData();
  }, [fetchData]);

  const updateBedStatus = useCallback(async (bedId: string, status: string) => {
    const { error } = await supabase.from('health_beds').update({ status }).eq('id', bedId);
    if (error) throw error;
    await fetchData();
  }, [fetchData]);

  const admitPatient = useCallback(async (admitData: any) => {
    const { data, error } = await supabase.from('health_beds').insert(admitData).select().single();
    if (error) throw error;
    // Mark bed as occupied
    if (admitData.bed_id) {
      await supabase.from('health_beds').update({ status: 'occupied' }).eq('id', admitData.bed_id);
    }
    await fetchData();
    return data;
  }, [fetchData]);

  const dischargePatient = useCallback(async (admissionId: string, patientId: string, dischargeData: any) => {
    const { error: dischargeError } = await supabase.from('health_beds').insert({
      admission_id: admissionId,
      patient_id: patientId,
      facility_id: facilityId,
      ...dischargeData,
      discharge_date: new Date().toISOString(),
    });
    if (dischargeError) throw dischargeError;
    // Update admission status
    await supabase.from('health_beds').update({ status: 'discharged' }).eq('id', admissionId);
    // Free the bed
    const { data: adm } = await supabase.from('health_beds').select('bed_id').eq('id', admissionId).single();
    if (adm?.bed_id) {
      await supabase.from('health_beds').update({ status: 'available' }).eq('id', adm.bed_id);
    }
    await fetchData();
  }, [facilityId, fetchData]);

  const inviteStaff = useCallback(async (staffData: any) => {
    const { error } = await supabase.from('health_staff').insert(staffData);
    if (error) throw error;
    await fetchData();
  }, [fetchData]);

  return {
    stats, admissions, activeAdmissions, discharges, beds, availableBeds, staff, staffOnDuty,
    recentAdmissions, recentDischarges, loading, error, refresh: fetchData,
    addBed, updateBedStatus, admitPatient, dischargePatient, inviteStaff
  };
}
