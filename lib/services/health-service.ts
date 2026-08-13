// @ts-nocheck
import { handleServiceError } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import type {
  Patient, Doctor, Appointment, Prescription, MedicalRecord,
  HealthFacility, LabResult, InsuranceClaim, AmbulanceRequest,
  Pharmacy, HealthRole, VitalSigns, Medication, Diagnosis,
  TreatmentPlan, HealthAnalytics, Notification
} from '@/types/health';

export * from './health-appointment.service';
export * from './health-facility.service';
export * from './health-patient.service';
export * from './health-pharmacy.service';
