import { supabase } from '@/lib/supabase';
import { PoliceCase, CaseStatus, CasePriority, CaseTimelineEvent } from '../types/police.types';

export interface CaseUpdate {
  notes: string;
  updated_by: string;
  status?: CaseStatus;
}

export class CaseService {
  async getCases(filters?: { status?: CaseStatus; priority?: CasePriority; assignedTo?: string }) {
    let query = supabase.from('police_cases').select('*');
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.priority) query = query.eq('priority', filters.priority);
    if (filters?.assignedTo) query = query.eq('assigned_officer_id', filters.assignedTo);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as PoliceCase[];
  }

  async getCaseById(id: string) {
    const { data, error } = await supabase.from('police_cases').select('*').eq('id', id).single();
    if (error) throw error;
    return data as PoliceCase;
  }

  async createCase(caseData: Partial<PoliceCase>) {
    const { data, error } = await supabase.from('police_cases').insert(caseData).select().single();
    if (error) throw error;
    return data as PoliceCase;
  }

  async updateCase(id: string, updates: Partial<PoliceCase>) {
    const { data, error } = await supabase.from('police_cases').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as PoliceCase;
  }

  async updateCaseStatus(id: string, status: CaseStatus, update?: CaseUpdate | string) {
    let notes = '';
    let updatedBy = 'system';
    if (typeof update === 'string') {
      notes = update;
    } else if (update) {
      notes = update.notes;
      updatedBy = update.updated_by;
    }
    const { data, error } = await supabase.rpc('update_case_status', {
      p_case_id: id, p_status: status, p_notes: notes, p_updated_by: updatedBy
    });
    if (error) throw error;
    return data;
  }

  async assignCase(id: string, officerId: string, assignedBy?: string) {
    const { data, error } = await supabase.from('police_cases')
      .update({ assigned_officer_id: officerId, assigned_by: assignedBy || 'system', assigned_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    return data as PoliceCase;
  }

  async assignOfficer(caseId: string, officerId: string) {
    return this.assignCase(caseId, officerId, 'system');
  }

  async getCaseHistory(caseId: string) {
    const { data, error } = await supabase.from('case_history').select('*').eq('case_id', caseId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async getCaseTimeline(caseId: string) {
    const { data, error } = await supabase.from('case_timeline')
      .select('*').eq('case_id', caseId).order('created_at', { ascending: true });
    if (error) throw error;
    return data as CaseTimelineEvent[];
  }

  async addCaseUpdate(caseId: string, update: CaseUpdate) {
    const { data, error } = await supabase.from('case_updates').insert({
      case_id: caseId, notes: update.notes, updated_by: update.updated_by, status: update.status,
    }).select().single();
    if (error) throw error;
    return data;
  }

  async searchCases(query: string) {
    const { data, error } = await supabase.from('police_cases')
      .select('*').or(`case_number.ilike.%${query}%,description.ilike.%${query}%,incident_location.ilike.%${query}%`);
    if (error) throw error;
    return data as PoliceCase[];
  }

  async getCasesByOfficer(officerId: string) {
    const { data, error } = await supabase.from('police_cases')
      .select('*').eq('assigned_officer_id', officerId).order('created_at', { ascending: false });
    if (error) throw error;
    return data as PoliceCase[];
  }

  async getCasesByReporter(reporterId: string) {
    const { data, error } = await supabase.from('police_cases')
      .select('*').eq('reporting_officer_id', reporterId).order('created_at', { ascending: false });
    if (error) throw error;
    return data as PoliceCase[];
  }

  async transferCase(caseId: string, fromOfficerId: string, toOfficerId: string, reason: string) {
    const { data, error } = await supabase.rpc('transfer_case', {
      p_case_id: caseId, p_from_officer: fromOfficerId, p_to_officer: toOfficerId, p_reason: reason
    });
    if (error) throw error;
    return data;
  }

  async escalateCase(caseId: string, reason: string, escalatedBy: string) {
    const { data, error } = await supabase.from('police_cases')
      .update({ priority: 'high', escalated_at: new Date().toISOString(), escalated_by: escalatedBy, escalation_reason: reason })
      .eq('id', caseId).select().single();
    if (error) throw error;
    return data as PoliceCase;
  }

  async getCaseStats(officerId?: string) {
    let query = supabase.from('police_cases').select('status', { count: 'exact' });
    if (officerId) query = query.eq('assigned_officer_id', officerId);
    const { data, error } = await query;
    if (error) throw error;
    const stats: Record<string, number> = {};
    data?.forEach((row: any) => { stats[row.status] = (stats[row.status] || 0) + 1; });
    return stats;
  }

  async closeCase(caseId: string, closureData: { outcome: string; closedBy: string; notes?: string }) {
    const { data, error } = await supabase.from('police_cases')
      .update({ status: 'closed', resolution_notes: closureData.notes, resolved_at: new Date().toISOString() })
      .eq('id', caseId).select().single();
    if (error) throw error;
    return data as PoliceCase;
  }

  async reopenCase(caseId: string, reason: string, reopenedBy: string) {
    const { data, error } = await supabase.from('police_cases')
      .update({ status: 'reopened', reopened_by: reopenedBy })
      .eq('id', caseId).select().single();
    if (error) throw error;
    return data as PoliceCase;
  }

  subscribeToCaseUpdates(caseId: string, callback: (payload: any) => void) {
    return supabase.channel(`case-${caseId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'case_updates', filter: `case_id=eq.${caseId}` }, callback)
      .subscribe();
  }

  subscribeToNewCases(callback: (payload: any) => void) {
    return supabase.channel('new-cases')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'police_cases' }, callback)
      .subscribe();
  }
}

export const caseService = new CaseService();
