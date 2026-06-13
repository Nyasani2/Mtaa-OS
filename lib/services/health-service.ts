import { supabase } from '@/lib/supabase';

export type HealthAction = 'emergency_sos' | 'register_patient' | 'book_appointment' | 'create_record' | 'write_prescription';

export interface HealthEmergencyParams {
  action: 'emergency_sos';
  userId: string;
  location: { lat: number; lng: number; address?: string };
  emergencyType: 'medical' | 'accident' | 'fire' | 'security';
  description?: string;
  contactPhone?: string;
}

export interface HealthRegisterPatientParams {
  action: 'register_patient';
  userId: string;
  personalInfo: {
    fullName: string; dob: string; gender: string; bloodGroup?: string;
    allergies?: string[]; conditions?: string[]; emergencyContact?: string;
  };
  insurance?: { provider: string; policyNumber: string };
}

export interface HealthBookAppointmentParams {
  action: 'book_appointment';
  patientId: string;
  providerId: string;
  providerType: 'doctor' | 'clinic' | 'hospital';
  appointmentType: 'consultation' | 'checkup' | 'procedure' | 'followup';
  dateTime: string;
  reason?: string;
  paymentMethod?: 'wallet' | 'mpesa' | 'insurance';
}

export interface HealthCreateRecordParams {
  action: 'create_record';
  patientId: string;
  providerId: string;
  recordType: 'diagnosis' | 'lab_result' | 'imaging' | 'vaccination' | 'surgery';
  data: Record<string, any>;
  attachments?: string[];
}

export interface HealthWritePrescriptionParams {
  action: 'write_prescription';
  doctorId: string;
  patientId: string;
  diagnosis: string;
  medications: Array<{
    name: string; dosage: string; frequency: string; duration: string; instructions?: string;
  }>;
  pharmacyId?: string;
}

export type HealthParams = 
  | HealthEmergencyParams | HealthRegisterPatientParams | HealthBookAppointmentParams 
  | HealthCreateRecordParams | HealthWritePrescriptionParams;

export async function healthOperation(params: HealthParams) {
  const { data, error } = await supabase.functions.invoke('health-operations', {
    body: params,
  });
  if (error) throw error;
  return data;
}

export const emergencySOS = (p: Omit<HealthEmergencyParams, 'action'>) => 
  healthOperation({ action: 'emergency_sos', ...p } as HealthEmergencyParams);

export const registerPatient = (p: Omit<HealthRegisterPatientParams, 'action'>) => 
  healthOperation({ action: 'register_patient', ...p } as HealthRegisterPatientParams);

export const bookAppointment = (p: Omit<HealthBookAppointmentParams, 'action'>) => 
  healthOperation({ action: 'book_appointment', ...p } as HealthBookAppointmentParams);

export const createRecord = (p: Omit<HealthCreateRecordParams, 'action'>) => 
  healthOperation({ action: 'create_record', ...p } as HealthCreateRecordParams);

export const writePrescription = (p: Omit<HealthWritePrescriptionParams, 'action'>) => 
  healthOperation({ action: 'write_prescription', ...p } as HealthWritePrescriptionParams);
