// @ts-nocheck
import { supabase } from '@/lib/supabase';

export class TelemedicineService {
  async startOrJoin({ sessionId, appointmentId, userId, role }: any) {
    if (sessionId) {
      const { data, error } = await supabase.from('telemedicine_sessions').select('*').eq('id', sessionId).single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await supabase
      .from('telemedicine_sessions')
      .insert({
        appointment_id: appointmentId || null,
        patient_id: role === 'patient' ? userId : null,
        doctor_id: role === 'doctor' ? userId : null,
        status: 'active',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async endSession(sessionId: string, durationSeconds: number, notes?: string) {
    if (!sessionId) return;
    await supabase
      .from('telemedicine_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString(), duration_seconds: durationSeconds, notes: notes || null })
      .eq('id', sessionId);
  }

  joinChannel(sessionId: string, userId: string, handlers: any) {
    const channel = supabase
      .channel(`telemed-${sessionId}`)
      .on('presence' as any, { event: 'sync' } as any, () => {
        const state: any = channel.presenceState();
        const peers = Object.values(state).flat() as any[];
        handlers.onPresence?.(peers);
      })
      .on('broadcast' as any, { event: 'chat' } as any, ({ payload }: any) => handlers.onMessage?.(payload))
      .on('broadcast' as any, { event: 'control' } as any, ({ payload }: any) => handlers.onControl?.(payload))
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          try { await channel.track({ userId, joinedAt: Date.now() }); } catch {}
        }
      });
    return channel;
  }

  async sendChat(channel: any, payload: any) {
    await channel.send({ type: 'broadcast', event: 'chat', payload });
  }
  async sendControl(channel: any, payload: any) {
    await channel.send({ type: 'broadcast', event: 'control', payload });
  }
}

export const telemedicineService = new TelemedicineService();
