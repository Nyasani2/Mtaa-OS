import { supabase } from '@/lib/supabase';

export interface BodycamSession {
  id: string;
  officer_id: string;
  device_id: string;
  shift_id?: string;
  started_at: string;
  ended_at?: string;
  status: 'active' | 'paused' | 'completed' | 'emergency';
  recording_count: number;
  emergency_activations: number;
  auto_upload_enabled: boolean;
  metadata: any;
  created_at: string;
}

export interface ShiftAssignment {
  id: string;
  officer_id: string;
  shift_start: string;
  shift_end?: string;
  vehicle_id?: string;
  beat_area?: string;
  supervisor_id?: string;
  status: 'scheduled' | 'active' | 'completed';
  metadata: any;
}

export async function startBodycamSession(officerId: string, deviceId: string, shiftId?: string) {
  const { data, error } = await supabase
    .from('bodycam_sessions')
    .insert({
      officer_id: officerId,
      device_id: deviceId,
      shift_id: shiftId,
      status: 'active',
      recording_count: 0,
      emergency_activations: 0,
      auto_upload_enabled: true,
      metadata: {},
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function endBodycamSession(sessionId: string) {
  const { data, error } = await supabase
    .from('bodycam_sessions')
    .update({ status: 'completed', ended_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function triggerEmergency(sessionId: string, location?: { lat: number; lng: number }) {
  const { data: session } = await supabase
    .from('bodycam_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  const { data, error } = await supabase
    .from('bodycam_sessions')
    .update({
      status: 'emergency',
      emergency_activations: (session?.emergency_activations || 0) + 1,
      metadata: {
        ...session?.metadata,
        last_emergency: { at: new Date().toISOString(), location },
      },
    })
    .eq('id', sessionId)
    .select()
    .maybeSingle();

  if (error) throw error;

  // Create incident record
  await supabase.from('incidents').insert({
    incident_type: 'bodycam_emergency',
    severity: 'critical',
    title: 'Bodycam Emergency Activation',
    reporter_id: session?.officer_id,
    status: 'open',
    lat: location?.lat,
    lng: location?.lng,
  });

  return data;
}

export async function getOfficerSessions(officerId: string, limit = 20) {
  const { data, error } = await supabase
    .from('bodycam_sessions')
    .select(`
      *,
      device:device_id(*),
      officer:officer_id(id, full_name, badge_number)
    `)
    .eq('officer_id', officerId)
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getActiveSessions() {
  const { data, error } = await supabase
    .from('bodycam_sessions')
    .select(`
      *,
      device:device_id(*),
      officer:officer_id(id, full_name, badge_number)
    `)
    .eq('status', 'active')
    .order('started_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function assignShift(assignment: Omit<ShiftAssignment, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('shift_assignments')
    .insert(assignment)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getOfficerShifts(officerId: string) {
  const { data, error } = await supabase
    .from('shift_assignments')
    .select('*')
    .eq('officer_id', officerId)
    .order('shift_start', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function lockEvidenceFromSession(sessionId: string, reason: string) {
  const { data: recordings } = await supabase
    .from('recordings')
    .select('id')
    .eq('session_id', sessionId);

  for (const rec of recordings || []) {
    await supabase.from('evidence').insert({
      recording_id: rec.id,
      evidence_type: 'bodycam_emergency',
      title: 'Emergency Evidence Lock',
      severity: 'critical',
      is_locked: true,
      locked_at: new Date().toISOString(),
      lock_reason: reason,
    });
  }

  return { locked: (recordings || []).length };
}
