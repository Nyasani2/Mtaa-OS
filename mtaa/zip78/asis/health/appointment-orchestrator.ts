import { HealthProvider } from './types';

export interface Appointment { id: string; userId: string; providerId: string; providerName: string; date: string; time: string; type: 'in_person' | 'telemedicine' | 'home_visit'; status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'; reason: string; notes?: string; reminderSent: boolean; createdAt: string; updatedAt: string; }

export class AppointmentOrchestrator {
  private appointments: Map<string, Appointment> = new Map();

  async schedule(userId: string, provider: HealthProvider, date: string, time: string, type: Appointment['type'], reason: string): Promise<Appointment> {
    const appt: Appointment = { id: `appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, userId, providerId: provider.id, providerName: provider.name, date, time, type, status: 'scheduled', reason, reminderSent: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.appointments.set(appt.id, appt); return appt;
  }
  async confirm(id: string): Promise<Appointment> { const a = this.appointments.get(id); if (!a) throw new Error('Not found'); const u = { ...a, status: 'confirmed' as const, updatedAt: new Date().toISOString() }; this.appointments.set(id, u); return u; }
  async cancel(id: string, reason?: string): Promise<Appointment> { const a = this.appointments.get(id); if (!a) throw new Error('Not found'); const u = { ...a, status: 'cancelled' as const, updatedAt: new Date().toISOString(), notes: reason ? `${a.notes || ''} Cancelled: ${reason}` : a.notes }; this.appointments.set(id, u); return u; }
  async complete(id: string): Promise<Appointment> { const a = this.appointments.get(id); if (!a) throw new Error('Not found'); const u = { ...a, status: 'completed' as const, updatedAt: new Date().toISOString() }; this.appointments.set(id, u); return u; }
  async getUserAppointments(userId: string): Promise<Appointment[]> { return Array.from(this.appointments.values()).filter(a => a.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); }
  async getUpcoming(userId: string): Promise<Appointment[]> { const now = new Date().toISOString().split('T')[0]; return (await this.getUserAppointments(userId)).filter(a => a.date >= now && (a.status === 'scheduled' || a.status === 'confirmed')); }
  async sendReminder(id: string): Promise<void> { const a = this.appointments.get(id); if (!a) return; a.reminderSent = true; this.appointments.set(id, a); }
}
