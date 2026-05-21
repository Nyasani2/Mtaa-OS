// lib/health/services/appointment.service.ts
import { supabase } from '@/lib/supabase';
import { HealthAppointment, HealthQueue } from '../types';

export class AppointmentService {
  static async createAppointment(appointment: Omit<HealthAppointment, 'id' | 'created_at' | 'updated_at'>): Promise<HealthAppointment> {
    const { data, error } = await supabase
      .from('health_appointments')
      .insert(appointment)
      .select()
      .single();
    if (error) throw error;
    return data as HealthAppointment;
  }

  static async getAppointmentById(appointmentId: string): Promise<HealthAppointment | null> {
    const { data, error } = await supabase
      .from('health_appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();
    if (error) throw error;
    return data as HealthAppointment | null;
  }

  static async updateAppointmentStatus(
    appointmentId: string, 
    status: HealthAppointment['status'],
    metadata?: Record<string, any>
  ): Promise<HealthAppointment> {
    const updates: any = { status };
    if (status === 'checked_in') updates.checked_in_at = new Date().toISOString();
    if (status === 'in_progress') updates.started_at = new Date().toISOString();
    if (status === 'completed') updates.completed_at = new Date().toISOString();
    if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();
    if (metadata) updates.metadata = metadata;

    const { data, error } = await supabase
      .from('health_appointments')
      .update(updates)
      .eq('id', appointmentId)
      .select()
      .single();
    if (error) throw error;
    return data as HealthAppointment;
  }

  static async getDoctorAppointments(providerId: string, date?: string): Promise<HealthAppointment[]> {
    let query = supabase.from('health_appointments').select('*').eq('provider_id', providerId);
    if (date) query = query.eq('scheduled_date', date);
    const { data, error } = await query.order('scheduled_time', { ascending: true });
    if (error) throw error;
    return data as HealthAppointment[] || [];
  }

  static async getTodayAppointments(hospitalId: string): Promise<HealthAppointment[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('health_appointments')
      .select('*')
      .eq('scheduled_date', today)
      .order('scheduled_time', { ascending: true });
    if (error) throw error;
    return data as HealthAppointment[] || [];
  }

  static async addToQueue(queueEntry: Omit<HealthQueue, 'id' | 'created_at' | 'updated_at'>): Promise<HealthQueue> {
    const { data, error } = await supabase
      .from('health_queues')
      .insert(queueEntry)
      .select()
      .single();
    if (error) throw error;
    return data as HealthQueue;
  }

  static async getQueueByDepartment(departmentId: string): Promise<HealthQueue[]> {
    const { data, error } = await supabase
      .from('health_queues')
      .select('*')
      .eq('department_id', departmentId)
      .eq('status', 'waiting')
      .order('priority_score', { ascending: false })
      .order('checked_in_at', { ascending: true });
    if (error) throw error;
    return data as HealthQueue[] || [];
  }
}
