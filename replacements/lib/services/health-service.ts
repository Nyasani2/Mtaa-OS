import { handleServiceError } from '@/lib/utils';
import type {
  Appointment,
  Hospital,
  Doctor,
  Patient,
  Prescription,
  MedicalRecord,
  LabResult,
  AmbulanceRequest,
  HealthFacility,
  HealthRole,
  Pharmacy,
  InsuranceClaim,
  VitalsReading,
  BedAllocation,
  QueueEntry,
  Department,
  Shift,
  Medication,
  Surgery,
  Referral,
  BillingItem,
} from '@/types/health';

export * from './health-appointment.service';
export * from './health-facility.service';
export * from './health-patient.service';
export * from './health-pharmacy.service';
