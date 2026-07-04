export type HealthRecordType = 'visit' | 'prescription' | 'lab' | 'imaging' | 'vaccination' | 'note' | 'allergy';

export interface HealthRecordMetadata {
  id: string;
  type: HealthRecordType;
  patientId: string;
  hospitalId: string;
  hospitalName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  title: string;
  summary: string;
  signature?: string;
  checksum: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisitRecord {
  chiefComplaint: string;
  symptoms: string[];
  diagnosis: string;
  notes: string;
  followUpDate?: string;
  followUpInstructions?: string;
}

export interface PrescriptionRecord {
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    isControlled: boolean;
  }[];
  pharmacyId?: string;
  pharmacyName?: string;
  isDispensed: boolean;
  dispensedAt?: string;
}

export interface LabResultRecord {
  labName: string;
  testType: string;
  results: {
    parameter: string;
    value: string | number;
    unit: string;
    referenceRange: string;
    status: 'normal' | 'abnormal' | 'critical';
  }[];
  overallStatus: 'normal' | 'abnormal' | 'critical';
  pdfUrl?: string;
}

export interface ImagingRecord {
  imagingType: 'xray' | 'mri' | 'ct' | 'ultrasound' | 'other';
  bodyPart: string;
  findings: string;
  impression: string;
  imageUrls: string[];
  radiologistName: string;
}

export interface VaccinationRecord {
  vaccineName: string;
  doseNumber: number;
  totalDoses: number;
  administeredBy: string;
  batchNumber?: string;
  nextDoseDate?: string;
  isComplete: boolean;
}

export interface TimelineEntry {
  id: string;
  date: string;
  type: HealthRecordType;
  title: string;
  subtitle: string;
  hospitalName: string;
  doctorName: string;
  status: 'normal' | 'abnormal' | 'critical';
  isVerified: boolean;
}
