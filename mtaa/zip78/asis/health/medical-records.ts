import { HealthRecord, HealthCategory } from './types';

export interface PrescriptionRecord { medication: string; dosage: string; frequency: string; prescribedBy: string; prescribedDate: string; duration: string; notes?: string; }
export interface VisitRecord { providerId: string; providerName: string; visitDate: string; reason: string; diagnosis?: string; notes?: string; followUpRequired?: boolean; followUpDate?: string; }
export interface LabResult { testName: string; testDate: string; results: { key: string; value: string; unit?: string; referenceRange?: string }[]; labName: string; orderedBy: string; }
export interface ImmunizationRecord { vaccine: string; date: string; provider: string; batchNumber?: string; nextDoseDate?: string; }
export interface AllergyRecord { allergen: string; severity: 'mild' | 'moderate' | 'severe' | 'life-threatening'; reaction: string; diagnosedDate?: string; }
export interface EmergencyContact { name: string; relationship: string; phone: string; email?: string; isPrimary: boolean; }

export class MedicalRecords {
  static createPrescription(userId: string, data: PrescriptionRecord): Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'> {
    return { userId, category: 'prescriptions', title: `${data.medication} — ${data.dosage}`, content: JSON.stringify(data), source: 'provider' };
  }
  static createVisit(userId: string, data: VisitRecord): Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'> {
    return { userId, category: 'visits', title: `Visit: ${data.providerName} — ${data.reason}`, content: JSON.stringify(data), source: 'provider', providerId: data.providerId };
  }
  static createLabResult(userId: string, data: LabResult): Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'> {
    return { userId, category: 'lab_results', title: `Lab: ${data.testName}`, content: JSON.stringify(data), source: 'provider' };
  }
  static createImmunization(userId: string, data: ImmunizationRecord): Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'> {
    return { userId, category: 'immunizations', title: data.vaccine, content: JSON.stringify(data), source: 'provider' };
  }
  static createAllergy(userId: string, data: AllergyRecord): Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'> {
    return { userId, category: 'allergies', title: `Allergy: ${data.allergen} (${data.severity})`, content: JSON.stringify(data), source: 'user' };
  }
  static createEmergencyContact(userId: string, data: EmergencyContact): Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'> {
    return { userId, category: 'emergency_contacts', title: `${data.name} (${data.relationship})`, content: JSON.stringify(data), source: 'user' };
  }
  static parseContent<T>(record: HealthRecord): T { try { return JSON.parse(record.content) as T; } catch { return {} as T; } }
}
