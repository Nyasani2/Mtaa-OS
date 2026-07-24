/**
 * MTAA Regulatory — Audit Service
 * Manages immutable audit logs for regulatory compliance
 */

import { supabase } from '@/lib/supabase'
import { systemEventBus } from '@/lib/system/event-bus'

export interface AuditLogEntry {
  id: string
  table_name: string
  record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  old_data?: Record<string, any>
  new_data?: Record<string, any>
  changed_by: string
  changed_at: string
  session_id?: string
  ip_address?: string
  reason?: string
}

export interface AuditQuery {
  tableName?: string
  recordId?: string
  action?: 'INSERT' | 'UPDATE' | 'DELETE'
  changedBy?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

export interface AuditSummary {
  totalChanges: number
  inserts: number
  updates: number
  deletes: number
  byTable: Record<string, number>
  byUser: Record<string, number>
  period: { start: string; end: string }
}

class AuditService {
  private static instance: AuditService

  static getInstance(): AuditService {
    if (!AuditService.instance) AuditService.instance = new AuditService()
    return AuditService.instance
  }

  async queryLogs(query: AuditQuery = {}): Promise<{ data: AuditLogEntry[]; count: number; error?: string }> {
    let sbQuery = supabase.from('audit_logs').select('*', { count: 'exact' })
    if (query.tableName) sbQuery = sbQuery.eq('table_name', query.tableName)
    if (query.recordId) sbQuery = sbQuery.eq('record_id', query.recordId)
    if (query.action) sbQuery = sbQuery.eq('action', query.action)
    if (query.changedBy) sbQuery = sbQuery.eq('changed_by', query.changedBy)
    if (query.startDate) sbQuery = sbQuery.gte('changed_at', query.startDate)
    if (query.endDate) sbQuery = sbQuery.lte('changed_at', query.endDate)
    sbQuery = sbQuery.order('changed_at', { ascending: false })
    if (query.limit) sbQuery = sbQuery.limit(query.limit)
    if (query.offset) sbQuery = sbQuery.range(query.offset, query.offset + (query.limit || 50) - 1)
    const { data, error, count } = await sbQuery
    if (error) return { data: [], count: 0, error: error.message }
    return { data: (data || []) as AuditLogEntry[], count: count || 0 }
  }

  async getSummary(startDate: string, endDate: string): Promise<AuditSummary> {
    const { data, error } = await supabase.rpc('get_audit_summary', { p_start_date: startDate, p_end_date: endDate })
    if (error) return { totalChanges: 0, inserts: 0, updates: 0, deletes: 0, byTable: {}, byUser: {}, period: { start: startDate, end: endDate } }
    return data as AuditSummary
  }

  async getRecordHistory(recordId: string): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase.from('audit_logs').select('*').eq('record_id', recordId).order('changed_at', { ascending: true })
    if (error) return []
    return (data || []) as AuditLogEntry[]
  }

  subscribeToAudit(callback: (entry: AuditLogEntry) => void): () => void {
    return systemEventBus.on('system:audit:**', (event) => callback(event.payload as AuditLogEntry))
  }
}

export const auditService = AuditService.getInstance()
