// lib/health/controllers/health.controller.ts
import { PatientService } from '../services/patient.service';
import { AppointmentService } from '../services/appointment.service';
import { HospitalService } from '../services/hospital.service';
import { EHRService } from '../services/ehr.service';
import { AmbulanceService } from '../services/ambulance.service';
import { HealthPatient, HealthAppointment, HealthHospital, HealthRecord, HealthLabTest, HealthAlert, HealthQueue, HealthEHRRecord, HealthAmbulanceRequest } from '../types';

export class HealthController {
  static async getOrCreatePatient(userId: string, patientData: Partial<HealthPatient>): Promise<HealthPatient> {
    let patient = await PatientService.getPatientByUserId(userId);
    if (!patient) {
      const code = `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      patient = await PatientService.createPatient({
        user_id: userId, patient_code: code,
        first_name: patientData.first_name || '', last_name: patientData.last_name || '',
        date_of_birth: patientData.date_of_birth || '', gender: patientData.gender || '',
        status: 'active', allergies: [], chronic_conditions: [], current_medications: [], metadata: {},
      } as any);
    }
    return patient;
  }

  static async getPatientDashboard(patientId: string) {
    const [records, appointments, labTests] = await Promise.all([
      PatientService.getPatientRecords(patientId),
      PatientService.getPatientAppointments(patientId),
      PatientService.getPatientLabTests(patientId),
    ]);
    return {
      totalVisits: records.length,
      upcomingAppointments: appointments.filter(a => a.status === 'scheduled' && new Date(a.scheduled_date) >= new Date()),
      pendingLabTests: labTests.filter(t => t.result_status === 'pending'),
      recentRecords: records.slice(0, 5),
    };
  }

  static async bookAppointment(appointmentData: Omit<HealthAppointment, 'id' | 'created_at' | 'updated_at'>): Promise<HealthAppointment> {
    return AppointmentService.createAppointment(appointmentData);
  }

  static async checkInToQueue(appointmentId: string, queueData: Omit<HealthQueue, 'id' | 'created_at' | 'updated_at'>): Promise<HealthQueue> {
    await AppointmentService.updateAppointmentStatus(appointmentId, 'checked_in');
    return AppointmentService.addToQueue(queueData);
  }

  static async getHospitalDashboard(hospitalId: string) {
    const [departments, alerts, stats] = await Promise.all([
      HospitalService.getHospitalDepartments(hospitalId),
      HospitalService.getHospitalAlerts(hospitalId),
      HospitalService.getHospitalStats(hospitalId),
    ]);
    return { departments, activeAlerts: alerts, stats };
  }

  static async createPatientVisit(ehrData: Omit<HealthEHRRecord, 'id' | 'created_at' | 'updated_at'>): Promise<HealthEHRRecord> {
    return EHRService.createEHRRecord(ehrData);
  }

  static async requestEmergencyAmbulance(request: Omit<HealthAmbulanceRequest, 'id' | 'status' | 'created_at' | 'updated_at'>): Promise<HealthAmbulanceRequest> {
    return AmbulanceService.requestAmbulance(request);
  }
}
