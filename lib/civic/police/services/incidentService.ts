import { supabase } from '@/lib/supabase';
import { EmergencyCall, CasePriority } from '../types/police.types';

export class IncidentService {
  async getIncidents(filters?: { status?: string; priority?: CasePriority; type?: string } | string) {
    let query = supabase.from('police_incidents').select('*');
    if (typeof filters === 'string') {
      query = query.eq('dispatch_status', filters);
    } else if (filters) {
      if (filters.status) query = query.eq('dispatch_status', filters.status);
      if (filters.priority) query = query.eq('priority', filters.priority);
      if (filters.type) query = query.eq('emergency_type', filters.type);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as EmergencyCall[];
  }

  async getLiveIncidents(filter?: { status?: string; priority?: CasePriority; type?: string } | string) {
    if (typeof filter === 'string') {
      return this.getIncidents(filter);
    }
    return this.getIncidents(filter || { status: 'received' });
  }

  async getIncidentById(id: string) {
    const { data, error } = await supabase.from('police_incidents').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as EmergencyCall;
  }

  async createIncident(incident: Omit<EmergencyCall, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('police_incidents').insert(incident).select().maybeSingle();
    if (error) throw error;
    return data as EmergencyCall;
  }

  async updateIncident(id: string, updates: Partial<EmergencyCall>) {
    const { data, error } = await supabase.from('police_incidents').update(updates).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return data as EmergencyCall;
  }

  async deleteIncident(id: string) {
    const { error } = await supabase.from('police_incidents').delete().eq('id', id);
    if (error) throw error;
  }

  async updateIncidentStatus(id: string, status: string, notes?: string, updatedBy?: string) {
    const { data, error } = await supabase.from('police_incidents')
      .update({ dispatch_status: status, status_notes: notes, status_updated_by: updatedBy, status_updated_at: new Date().toISOString() })
      .eq('id', id).select().maybeSingle();
    if (error) throw error;
    return data as EmergencyCall;
  }

  async updateDispatchStatus(incidentId: string, status: string, officerIds?: string | string[]) {
    const updates: any = { dispatch_status: status, updated_at: new Date().toISOString() };
    if (officerIds) {
      if (Array.isArray(officerIds)) {
        updates.assigned_officer_id = officerIds[0];
      } else {
        updates.assigned_officer_id = officerIds;
      }
    }
    const { data, error } = await supabase.from('police_incidents')
      .update(updates).eq('id', incidentId).select().maybeSingle();
    if (error) throw error;
    return data as EmergencyCall;
  }

  async assignIncident(id: string, officerId: string, assignedBy?: string) {
    const { data, error } = await supabase.from('police_incidents')
      .update({ assigned_officer_id: officerId, assigned_by: assignedBy || 'system', assigned_at: new Date().toISOString() })
      .eq('id', id).select().maybeSingle();
    if (error) throw error;
    return data as EmergencyCall;
  }

  async getIncidentsByLocation(lat: number, lng: number, radiusKm: number = 5) {
    const { data, error } = await supabase.rpc('get_incidents_near_location', { p_lat: lat, p_lng: lng, p_radius_km: radiusKm });
    if (error) throw error;
    return data as EmergencyCall[];
  }

  async getIncidentsByOfficer(officerId: string) {
    const { data, error } = await supabase.from('police_incidents')
      .select('*').eq('assigned_officer_id', officerId).order('created_at', { ascending: false });
    if (error) throw error;
    return data as EmergencyCall[];
  }

  async getIncidentStats() {
    const { data, error } = await supabase.from('police_incidents').select('dispatch_status, emergency_type', { count: 'exact' });
    if (error) throw error;
    const stats = { byStatus: {} as Record<string, number>, byType: {} as Record<string, number>, total: data?.length || 0 };
    data?.forEach((row: any) => {
      stats.byStatus[row.dispatch_status] = (stats.byStatus[row.dispatch_status] || 0) + 1;
      stats.byType[row.emergency_type] = (stats.byType[row.emergency_type] || 0) + 1;
    });
    return stats;
  }

  async searchIncidents(query: string) {
    const { data, error } = await supabase.from('police_incidents')
      .select('*').or(`description.ilike.%${query}%,caller_name.ilike.%${query}%,caller_phone.ilike.%${query}%`);
    if (error) throw error;
    return data as EmergencyCall[];
  }

  subscribeToIncidentUpdates(callback: (payload: any) => void) {
    return supabase.channel('incident-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'police_incidents' }, callback)
      .subscribe();
  }

  // Hook passes: (stationId, callback)
  subscribeToIncidents(stationId: string, callback: (payload: any) => void) {
    return this.subscribeToIncidentUpdates(callback);
  }

  subscribeToNewIncidents(callback: (payload: any) => void) {
    return supabase.channel('new-incidents')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'police_incidents' }, callback)
      .subscribe();
  }
}

export const incidentService = new IncidentService();
