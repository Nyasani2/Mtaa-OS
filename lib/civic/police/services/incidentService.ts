import { supabase } from '../../shared/lib/supabase'
import { EmergencyCall } from '../types/police.types'

export const incidentService = {
  async getLiveIncidents(stationId?: string, limit: number = 50): Promise<EmergencyCall[]> {
    let query = supabase
      .from('police_emergency_calls')
      .select('*')
      .in('dispatch_status', ['received', 'dispatched', 'en_route', 'on_scene'])
      .order('created_at', { ascending: false })
      .limit(limit)

    if (stationId) {
      query = query.eq('station_id', stationId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getRecentIncidents(stationId?: string, limit: number = 20): Promise<EmergencyCall[]> {
    let query = supabase
      .from('police_emergency_calls')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (stationId) {
      query = query.eq('station_id', stationId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async updateDispatchStatus(
    incidentId: string, 
    status: EmergencyCall['dispatch_status'],
    officerIds?: string[]
  ): Promise<void> {
    const updates: any = { 
      dispatch_status: status,
      updated_at: new Date().toISOString()
    }

    if (status === 'dispatched') {
      updates.dispatch_time = new Date().toISOString()
      if (officerIds) updates.dispatched_officer_ids = officerIds
    }
    if (status === 'on_scene') {
      updates.arrival_time = new Date().toISOString()
    }
    if (status === 'resolved') {
      updates.resolution_time = new Date().toISOString()
    }

    const { error } = await supabase
      .from('police_emergency_calls')
      .update(updates)
      .eq('id', incidentId)

    if (error) throw error
  },

  async createIncident(incident: Partial<EmergencyCall>): Promise<EmergencyCall> {
    const { data, error } = await supabase
      .from('police_emergency_calls')
      .insert({
        ...incident,
        call_uuid: `EMRG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  subscribeToIncidents(stationId: string, callback: (incident: EmergencyCall) => void) {
    return supabase
      .channel('emergency-calls')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'police_emergency_calls',
          filter: stationId ? `station_id=eq.${stationId}` : undefined
        },
        (payload) => {
          callback(payload.new as EmergencyCall)
        }
      )
      .subscribe()
  }
}
