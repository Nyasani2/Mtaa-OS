import { supabase } from '../../shared/lib/supabase'
import { PoliceCase, CaseFilter, CaseTimelineEvent, CaseStatus } from '../types/police.types'

export const caseService = {
  async getCases(filter: CaseFilter = {}): Promise<PoliceCase[]> {
    let query = supabase
      .from('police_cases')
      .select(`
        *,
        reporting_officer:reporting_officer_id(id, badge_number, full_name, rank),
        assigned_officer:assigned_officer_id(id, badge_number, full_name, rank),
        station:station_id(id, station_code, name)
      `)
      .order('created_at', { ascending: false })

    if (filter.status) {
      query = query.eq('status', filter.status)
    }
    if (filter.case_type) {
      query = query.eq('case_type', filter.case_type)
    }
    if (filter.priority) {
      query = query.eq('priority', filter.priority)
    }
    if (filter.date_from) {
      query = query.gte('created_at', filter.date_from)
    }
    if (filter.date_to) {
      query = query.lte('created_at', filter.date_to)
    }
    if (filter.search) {
      query = query.or(`case_number.ilike.%${filter.search}%,description.ilike.%${filter.search}%,reporter_name.ilike.%${filter.search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getCaseById(id: string): Promise<PoliceCase | null> {
    const { data, error } = await supabase
      .from('police_cases')
      .select(`
        *,
        reporting_officer:reporting_officer_id(id, badge_number, full_name, rank, phone),
        assigned_officer:assigned_officer_id(id, badge_number, full_name, rank, phone),
        station:station_id(id, station_code, name, address, phone)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async createCase(caseData: Partial<PoliceCase>): Promise<PoliceCase> {
    const { data, error } = await supabase
      .from('police_cases')
      .insert(caseData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateCase(id: string, updates: Partial<PoliceCase>): Promise<PoliceCase> {
    const { data, error } = await supabase
      .from('police_cases')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateCaseStatus(id: string, status: CaseStatus, notes?: string): Promise<void> {
    const updates: any = { status, updated_at: new Date().toISOString() }
    if (status === 'closed' || status === 'resolved') {
      updates.resolved_at = new Date().toISOString()
      updates.resolution_notes = notes
    }

    const { error } = await supabase
      .from('police_cases')
      .update(updates)
      .eq('id', id)

    if (error) throw error

    // Add timeline event
    await this.addTimelineEvent(id, 'status_changed', `Status updated to ${status}`, { new_status: status, notes })
  },

  async assignOfficer(caseId: string, officerId: string): Promise<void> {
    const { error } = await supabase
      .from('police_cases')
      .update({ 
        assigned_officer_id: officerId,
        status: 'under_investigation',
        updated_at: new Date().toISOString()
      })
      .eq('id', caseId)

    if (error) throw error

    await this.addTimelineEvent(caseId, 'officer_assigned', 'Case assigned to investigating officer', { officer_id: officerId })
  },

  async forwardCase(caseId: string, forwardTo: string, notes?: string): Promise<void> {
    const { error } = await supabase
      .from('police_cases')
      .update({
        forwarded_to: forwardTo,
        forwarded_at: new Date().toISOString(),
        status: 'transferred',
        forwarding_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', caseId)

    if (error) throw error

    await this.addTimelineEvent(caseId, 'case_forwarded', `Case forwarded to ${forwardTo}`, { forwarded_to: forwardTo, notes })
  },

  async getCaseTimeline(caseId: string): Promise<CaseTimelineEvent[]> {
    const { data, error } = await supabase
      .from('police_case_timeline')
      .select(`
        *,
        officer:officer_id(id, badge_number, full_name, rank)
      `)
      .eq('case_id', caseId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  async addTimelineEvent(caseId: string, action: string, description?: string, metadata?: Record<string, any>): Promise<void> {
    const { error } = await supabase
      .from('police_case_timeline')
      .insert({
        case_id: caseId,
        action,
        description,
        metadata,
        created_at: new Date().toISOString()
      })

    if (error) throw error
  },

  async getCaseStats(stationId?: string): Promise<{
    total: number
    open: number
    investigating: number
    closed: number
    critical: number
    by_type: Record<string, number>
  }> {
    let query = supabase.from('police_cases').select('*', { count: 'exact' })
    if (stationId) {
      query = query.eq('station_id', stationId)
    }

    const { count: total } = await query
    const { count: open } = await supabase.from('police_cases').select('*', { count: 'exact' }).eq('status', 'reported')
    const { count: investigating } = await supabase.from('police_cases').select('*', { count: 'exact' }).eq('status', 'under_investigation')
    const { count: closed } = await supabase.from('police_cases').select('*', { count: 'exact' }).in('status', ['closed', 'resolved', 'dismissed'])
    const { count: critical } = await supabase.from('police_cases').select('*', { count: 'exact' }).eq('priority', 'critical')

    const { data: byType } = await supabase
      .from('police_cases')
      .select('case_type')
      .then(res => {
        const counts: Record<string, number> = {}
        res.data?.forEach((c: any) => {
          counts[c.case_type] = (counts[c.case_type] || 0) + 1
        })
        return { data: counts }
      })

    return {
      total: total || 0,
      open: open || 0,
      investigating: investigating || 0,
      closed: closed || 0,
      critical: critical || 0,
      by_type: byType || {}
    }
  }
}
