import { supabase } from '@/lib/supabase';

export interface Evidence {
  id: string;
  recording_id: string;
  evidence_type: string;
  title: string;
  description?: string;
  severity: string;
  is_locked: boolean;
  locked_at?: string;
  locked_by?: string;
  lock_reason?: string;
  created_by?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  case_number?: string;
  incident_id?: string;
  police_report_id?: string;
  insurance_claim_id?: string;
  share_token?: string;
  share_expires_at?: string;
  download_count: number;
  digital_signature?: string;
  hash_verification?: string;
  clip_start_seconds?: number;
  clip_end_seconds?: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export async function createEvidence(evidence: Omit<Evidence, 'id' | 'created_at' | 'updated_at' | 'download_count'>) {
  const { data, error } = await supabase
    .from('evidence')
    .insert({ ...evidence, download_count: 0 })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getEvidence(filters?: {
  recording_id?: string;
  evidence_type?: string;
  severity?: string;
  is_locked?: boolean;
  case_number?: string;
  created_by?: string;
  limit?: number;
}) {
  let query = supabase.from('evidence').select(`
    *,
    recording:recording_id(*),
    creator:created_by(id, full_name),
    reviewer:reviewed_by(id, full_name)
  `).order('created_at', { ascending: false });

  if (filters?.recording_id) query = query.eq('recording_id', filters.recording_id);
  if (filters?.evidence_type) query = query.eq('evidence_type', filters.evidence_type);
  if (filters?.severity) query = query.eq('severity', filters.severity);
  if (filters?.is_locked !== undefined) query = query.eq('is_locked', filters.is_locked);
  if (filters?.case_number) query = query.eq('case_number', filters.case_number);
  if (filters?.created_by) query = query.eq('created_by', filters.created_by);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getEvidenceById(id: string) {
  const { data, error } = await supabase
    .from('evidence')
    .select(`
      *,
      recording:recording_id(*, device:device_id(*), driver:driver_id(id, full_name)),
      creator:created_by(id, full_name),
      reviewer:reviewed_by(id, full_name),
      locker:locked_by(id, full_name)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function lockEvidence(id: string, reason: string) {
  const { data, error } = await supabase
    .from('evidence')
    .update({
      is_locked: true,
      locked_at: new Date().toISOString(),
      locked_by: (await supabase.auth.getUser()).data.user?.id,
      lock_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function unlockEvidence(id: string) {
  const { data, error } = await supabase
    .from('evidence')
    .update({
      is_locked: false,
      locked_at: null,
      locked_by: null,
      lock_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function reviewEvidence(id: string, notes: string) {
  const { data, error } = await supabase
    .from('evidence')
    .update({
      reviewed_by: (await supabase.auth.getUser()).data.user?.id,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function linkEvidenceToCase(id: string, caseData: { case_number?: string; incident_id?: string; police_report_id?: string; insurance_claim_id?: string }) {
  const { data, error } = await supabase
    .from('evidence')
    .update({
      ...caseData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function generateShareToken(id: string, expiresInHours: number = 24) {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('evidence')
    .update({
      share_token: token,
      share_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return { token, expiresAt, evidence: data };
}

export async function revokeShareToken(id: string) {
  const { data, error } = await supabase
    .from('evidence')
    .update({
      share_token: null,
      share_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function incrementDownloadCount(id: string) {
  const { data, error } = await supabase.rpc('increment_evidence_download', { evidence_id: id });
  if (error) {
    // Fallback if RPC doesn't exist
    const { data: current } = await supabase.from('evidence').select('download_count').eq('id', id).single();
    const { data: updated, error: updateError } = await supabase
      .from('evidence')
      .update({ download_count: (current?.download_count || 0) + 1 })
      .eq('id', id)
      .select()
      .single();
    if (updateError) throw updateError;
    return updated;
  }
  return data;
}

export async function deleteEvidence(id: string) {
  const { data: ev } = await supabase.from('evidence').select('is_locked').eq('id', id).single();
  if (ev?.is_locked) {
    throw new Error('Cannot delete locked evidence');
  }
  const { error } = await supabase.from('evidence').delete().eq('id', id);
  if (error) throw error;
}

export const EVIDENCE_TYPES = [
  { id: 'crash', name: 'Crash', severity: 'critical' },
  { id: 'emergency_brake', name: 'Emergency Brake', severity: 'high' },
  { id: 'rollover', name: 'Rollover', severity: 'critical' },
  { id: 'airbag', name: 'Airbag Deployment', severity: 'critical' },
  { id: 'sos', name: 'SOS Alert', severity: 'critical' },
  { id: 'panic_button', name: 'Panic Button', severity: 'high' },
  { id: 'hijack', name: 'Vehicle Hijack', severity: 'critical' },
  { id: 'forced_entry', name: 'Forced Entry', severity: 'high' },
  { id: 'overspeed', name: 'Overspeed', severity: 'medium' },
  { id: 'harsh_acceleration', name: 'Harsh Acceleration', severity: 'medium' },
  { id: 'harsh_cornering', name: 'Harsh Cornering', severity: 'medium' },
  { id: 'harsh_braking', name: 'Harsh Braking', severity: 'medium' },
  { id: 'driver_fatigue', name: 'Driver Fatigue', severity: 'high' },
  { id: 'medical_emergency', name: 'Medical Emergency', severity: 'critical' },
  { id: 'bodycam_emergency', name: 'Bodycam Emergency', severity: 'critical' },
  { id: 'inspection_complete', name: 'Inspection Complete', severity: 'low' },
  { id: 'collision', name: 'Collision', severity: 'critical' },
  { id: 'near_miss', name: 'Near Miss', severity: 'medium' },
  { id: 'theft', name: 'Theft', severity: 'high' },
];
