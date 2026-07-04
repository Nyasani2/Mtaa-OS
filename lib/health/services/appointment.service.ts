import { supabase } from "@/lib/supabase/client";

export interface HealthAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  hospitalId: string;
  hospitalName: string;
  specialty: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  type: 'in_person' | 'telemedicine';
  reason: string;
  notes?: string;
  isFollowUp: boolean;
  previousAppointmentId?: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  amount: number;
  createdAt: string;
  updatedAt: string;
}

const TABLE = 'health_appointments';
const PATIENTS_TABLE = 'health_patients';

// Resolve MTAA user ID -> health_patients.id
async function resolvePatientId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from(PATIENTS_TABLE)
    .select('id')
    .eq('user_id', userId)
    .single();
  if (error || !data) return null;
  return data.id;
}

function mapDb(row: any): HealthAppointment {
  return {
    id: row.id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    doctorName: row.doctor_name,
    hospitalId: row.hospital_id,
    hospitalName: row.hospital_name,
    specialty: row.specialty,
    appointmentDate: row.appointment_date,
    appointmentTime: row.appointment_time,
    status: row.status,
    type: row.type,
    reason: row.reason,
    notes: row.notes,
    isFollowUp: row.is_follow_up,
    previousAppointmentId: row.previous_appointment_id,
    paymentStatus: row.payment_status,
    amount: row.amount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapToDb(a: Partial<HealthAppointment>): any {
  return {
    id: a.id,
    patient_id: a.patientId,
    doctor_id: a.doctorId,
    doctor_name: a.doctorName,
    hospital_id: a.hospitalId,
    hospital_name: a.hospitalName,
    specialty: a.specialty,
    appointment_date: a.appointmentDate,
    appointment_time: a.appointmentTime,
    status: a.status,
    type: a.type,
    reason: a.reason,
    notes: a.notes,
    is_follow_up: a.isFollowUp,
    previous_appointment_id: a.previousAppointmentId,
    payment_status: a.paymentStatus,
    amount: a.amount,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
  };
}

export class AppointmentService {
  /** Get all appointments for a user (resolves user_id -> patient_id internally) */
  static async getAppointments(userId: string): Promise<HealthAppointment[]> {
    const patientId = await resolvePatientId(userId);
    if (!patientId) return []; // No health profile yet — return empty, not error
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false });
    if (error || !data) return [];
    return data.map(mapDb);
  }

  /** Get upcoming appointments (scheduled or confirmed, from today onward) */
  static async getUpcomingAppointments(userId: string): Promise<HealthAppointment[]> {
    const patientId = await resolvePatientId(userId);
    if (!patientId) return [];
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('patient_id', patientId)
      .gte('appointment_date', today)
      .in('status', ['scheduled', 'confirmed'])
      .order('appointment_date', { ascending: true });
    if (error || !data) return [];
    return data.map(mapDb);
  }

  /** Book a new appointment */
  static async book(appointment: Omit<HealthAppointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<HealthAppointment | null> {
    const db = mapToDb({
      ...appointment,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const { data, error } = await supabase.from(TABLE).insert(db).select().single();
    if (error || !data) return null;
    return mapDb(data);
  }

  /** Cancel an appointment */
  static async cancel(appointmentId: string, reason?: string): Promise<boolean> {
    const { error } = await supabase
      .from(TABLE)
      .update({ status: 'cancelled', notes: reason, updated_at: new Date().toISOString() })
      .eq('id', appointmentId);
    return !error;
  }

  /** Reschedule an appointment */
  static async reschedule(appointmentId: string, newDate: string, newTime: string): Promise<boolean> {
    const { error } = await supabase
      .from(TABLE)
      .update({
        appointment_date: newDate,
        appointment_time: newTime,
        status: 'scheduled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId);
    return !error;
  }

  /** Mark appointment as completed */
  static async complete(appointmentId: string): Promise<boolean> {
    const { error } = await supabase
      .from(TABLE)
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', appointmentId);
    return !error;
  }

  /** Get available time slots for a doctor on a given date */
  static async getDoctorAvailability(doctorId: string, date: string): Promise<string[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('appointment_time')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .in('status', ['scheduled', 'confirmed']);
    if (error || !data) return [];
    const booked = data.map((r: any) => r.appointment_time);
    const slots = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
    return slots.filter(s => !booked.includes(s));
  }

  /** Update appointment status (legacy compat) */
  static async updateStatus(id: string, status: HealthAppointment['status']): Promise<HealthAppointment | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return null;
    return mapDb(data);
  }

  /** Create appointment (legacy alias for book) */
  static async createAppointment(data: Partial<HealthAppointment>): Promise<HealthAppointment | null> {
    return this.book(data as Omit<HealthAppointment, 'id' | 'createdAt' | 'updatedAt'>);
  }

  /** Update appointment status (legacy alias) */
  static async updateAppointmentStatus(id: string, status: string): Promise<void> {
    await this.updateStatus(id, status as HealthAppointment['status']);
  }

  /** Add to queue (legacy compat) */
  static async addToQueue(queueData: any): Promise<any> {
    const { data, error } = await supabase.from('health_queue').insert(queueData).select().single();
    if (error) throw error;
    return data;
  }
}
