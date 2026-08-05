import { supabase } from '@/lib/supabase';

export interface IncidentReport {
  id: string;
  incident_type: string;
  severity: string;
  status: string;
  lat?: number;
  lng?: number;
  address?: string;
  reporter_id?: string;
  driver_id?: string;
  vehicle_id?: string;
  officer_id?: string;
  recording_id?: string;
  evidence_id?: string;
  trip_id?: string;
  title: string;
  description?: string;
  injuries_reported: boolean;
  property_damage: boolean;
  police_notified: boolean;
  ambulance_notified: boolean;
  fire_notified: boolean;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export async function reportIncident(incident: Omit<IncidentReport, 'id' | 'created_at' | 'updated_at' | 'status'>) {
  const { data, error } = await supabase
    .from('incidents')
    .insert({ ...incident, status: 'open' })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getIncidentById(id: string) {
  const { data, error } = await supabase
    .from('incidents')
    .select(`
      *,
      reporter:reporter_id(id, full_name),
      driver:driver_id(id, full_name),
      vehicle:vehicle_id(*),
      officer:officer_id(id, full_name),
      recording:recording_id(*),
      evidence:evidence_id(*),
      resolver:resolved_by(id, full_name)
    `)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getIncidents(filters?: {
  status?: string;
  severity?: string;
  driver_id?: string;
  vehicle_id?: string;
  officer_id?: string;
  incident_type?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('incidents')
    .select(`
      *,
      reporter:reporter_id(id, full_name),
      driver:driver_id(id, full_name),
      vehicle:vehicle_id(plate_number, make, model)
    `)
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.severity) query = query.eq('severity', filters.severity);
  if (filters?.driver_id) query = query.eq('driver_id', filters.driver_id);
  if (filters?.vehicle_id) query = query.eq('vehicle_id', filters.vehicle_id);
  if (filters?.officer_id) query = query.eq('officer_id', filters.officer_id);
  if (filters?.incident_type) query = query.eq('incident_type', filters.incident_type);
  if (filters?.date_from) query = query.gte('created_at', filters.date_from);
  if (filters?.date_to) query = query.lte('created_at', filters.date_to);
  if (filters?.limit) query = query.limit(filters.limit);
  if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function updateIncidentStatus(id: string, status: string, notes?: string) {
  const { data: user } = await supabase.auth.getUser();
  const updates: any = { status, updated_at: new Date().toISOString() };

  if (status === 'resolved') {
    updates.resolved_at = new Date().toISOString();
    updates.resolved_by = user.user?.id;
    updates.resolution_notes = notes;
  }

  const { data, error } = await supabase
    .from('incidents')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function assignIncidentOfficer(id: string, officerId: string) {
  const { data, error } = await supabase
    .from('incidents')
    .update({ officer_id: officerId, status: 'investigating', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function linkIncidentToRecording(id: string, recordingId: string) {
  const { data, error } = await supabase
    .from('incidents')
    .update({ recording_id: recordingId, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function linkIncidentToEvidence(id: string, evidenceId: string) {
  const { data, error } = await supabase
    .from('incidents')
    .update({ evidence_id: evidenceId, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getIncidentStats(periodDays: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  const { data: byType } = await supabase
    .from('incidents')
    .select('incident_type')
    .gte('created_at', startDate.toISOString());

  const { data: bySeverity } = await supabase
    .from('incidents')
    .select('severity')
    .gte('created_at', startDate.toISOString());

  const { data: byStatus } = await supabase
    .from('incidents')
    .select('status')
    .gte('created_at', startDate.toISOString());

  const typeCounts: Record<string, number> = {};
  (byType || []).forEach((i: any) => { typeCounts[i.incident_type] = (typeCounts[i.incident_type] || 0) + 1; });

  const severityCounts: Record<string, number> = {};
  (bySeverity || []).forEach((i: any) => { severityCounts[i.severity] = (severityCounts[i.severity] || 0) + 1; });

  const statusCounts: Record<string, number> = {};
  (byStatus || []).forEach((i: any) => { statusCounts[i.status] = (statusCounts[i.status] || 0) + 1; });

  return {
    total: (byType || []).length,
    byType: typeCounts,
    bySeverity: severityCounts,
    byStatus: statusCounts,
    periodDays,
  };
}

export async function generateIncidentPackage(incidentId: string) {
  const incident = await getIncidentById(incidentId);
  if (!incident) throw new Error('Incident not found');

  const package_ = {
    incident,
    generated_at: new Date().toISOString(),
    package_id: `PKG-${incidentId.substring(0, 8)}`,
    contents: {
      incident_details: incident,
      recording: incident.recording,
      evidence: incident.evidence,
      timeline: [], // Would be populated from recordings
    },
  };

  return package_;
}
