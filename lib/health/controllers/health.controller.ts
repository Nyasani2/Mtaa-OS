import { PatientService } from "../services/patient.service";
import { AppointmentService } from "../services/appointment.service";
export class HealthController {
  static async registerPatient(userId: string, patientData: any): Promise<any> {
    let patient = await PatientService.getPatientByUserId(userId);
    if (!patient) {
      patient = await PatientService.createPatient({
        user_id: userId, first_name: patientData.first_name || "",
        last_name: patientData.last_name || "", ...patientData,
      });
    }
    return patient;
  }
  static async getPatientDashboard(patientId: string): Promise<any> {
    const [records, appointments, labTests] = await Promise.all([
      PatientService.getPatientRecords(patientId),
      PatientService.getPatientAppointments(patientId),
      PatientService.getPatientLabTests(patientId),
    ]);
    return {
      records, appointments, labTests,
      upcomingAppointments: appointments.filter((a: any) => a.status === "scheduled" && new Date(a.scheduled_date || a.scheduled_at) >= new Date()),
      pendingLabTests: labTests.filter((t: any) => t.result_status === "pending"),
      stats: { totalAppointments: appointments.length, totalRecords: records.length, pendingLabs: labTests.filter((t: any) => t.result_status === "pending").length },
    };
  }
  static async getDashboardStats(userId: string, role: string): Promise<any> {
    return { upcomingAppointments: 0, pendingLabTests: 0, unreadNotifications: 0, totalPatients: 0, activeQueues: 0 };
  }
  static async createAppointment(appointmentData: any): Promise<any> {
    return AppointmentService.createAppointment(appointmentData);
  }
  static async checkInPatient(appointmentId: string, queueData: any): Promise<any> {
    await AppointmentService.updateAppointmentStatus(appointmentId, "checked_in");
    return AppointmentService.addToQueue(queueData);
  }
}
