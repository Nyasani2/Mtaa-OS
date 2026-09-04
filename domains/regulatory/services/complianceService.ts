/**
 * MTAA Regulatory — Compliance Service
 * Manages compliance reports, tax records, sanctions screening, CBK reports
 */

import { supabase } from '@/lib/supabase';
import { systemEventBus } from '@/lib/system/event-bus';

export interface ComplianceReport {
  id: string
  report_type: string
  period_start: string
  period_end: string
  jurisdiction: string
  total_volume: number
  total_transactions: number
  total_users: number
  flagged_transactions: number
  flagged_amount: number
  report_data: Record<string, any>
  status: 'draft' | 'submitted' | 'acknowledged' | 'rejected'
  submitted_by: string | null
  submitted_at: string | null
  file_url: string | null
  created_at: string
  updated_at: string
}

export interface TaxRecord {
  id: string
  transaction_id: string | null
  user_id: string
  tax_type: string
  taxable_amount: number
  tax_rate: number
  tax_amount: number
  currency: string
  tax_period: string
  jurisdiction: string
  status: 'pending' | 'filed' | 'paid' | 'disputed' | 'waived'
  filed_at: string | null
  filed_by: string | null
  receipt_number: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CBKReport {
  id: string
  report_period: string
  report_type: string
  institution_code: string
  data: Record<string, any>
  file_reference: string | null
  status: 'draft' | 'submitted' | 'acknowledged'
  submitted_at: string | null
  created_at: string
  updated_at: string
}

class ComplianceService {
  private static instance: ComplianceService

  static getInstance(): ComplianceService {
    if (!ComplianceService.instance) ComplianceService.instance = new ComplianceService()
    return ComplianceService.instance
  }

  async generateReport(reportType: string, periodStart: string, periodEnd: string, jurisdiction: string = 'KE'): Promise<{ report: ComplianceReport | null; error?: string }> {
    const { data: summary, error: summaryError } = await supabase.rpc('get_regulatory_summary', { p_start_date: periodStart, p_end_date: periodEnd })
    if (summaryError) return { report: null, error: summaryError.message }
    const { data, error } = await supabase.from('compliance_reports').insert({
      report_type: reportType, period_start: periodStart, period_end: periodEnd, jurisdiction,
      total_volume: summary?.total_volume || 0, total_transactions: summary?.total_transactions || 0,
      total_users: summary?.active_users || 0, flagged_transactions: summary?.flagged_transactions || 0,
      flagged_amount: 0, report_data: summary, status: 'draft',
    }).select().single()
    if (error) return { report: null, error: error.message }
    return { report: data as ComplianceReport }
  }

  async getReports(options?: { type?: string; status?: string; jurisdiction?: string; limit?: number }): Promise<{ data: ComplianceReport[]; error?: string }> {
    let query = supabase.from('compliance_reports').select('*')
    if (options?.type) query = query.eq('report_type', options.type)
    if (options?.status) query = query.eq('status', options.status)
    if (options?.jurisdiction) query = query.eq('jurisdiction', options.jurisdiction)
    query = query.order('created_at', { ascending: false })
    if (options?.limit) query = query.limit(options.limit)
    const { data, error } = await query
    if (error) return { data: [], error: error.message }
    return { data: (data || []) as ComplianceReport[] }
  }

  async submitReport(reportId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.from('compliance_reports').update({
      status: 'submitted', submitted_by: userId, submitted_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', reportId)
    if (error) return { success: false, error: error.message }
    systemEventBus.emit('system:compliance:submitted', { reportId, submittedBy: userId }, { source: 'compliance-service' })
    return { success: true }
  }

  async getTaxRecords(options?: { userId?: string; taxType?: string; status?: string; period?: string; limit?: number }): Promise<{ data: TaxRecord[]; error?: string }> {
    let query = supabase.from('tax_records').select('*')
    if (options?.userId) query = query.eq('user_id', options.userId)
    if (options?.taxType) query = query.eq('tax_type', options.taxType)
    if (options?.status) query = query.eq('status', options.status)
    if (options?.period) query = query.eq('tax_period', options.period)
    query = query.order('created_at', { ascending: false })
    if (options?.limit) query = query.limit(options.limit)
    const { data, error } = await query
    if (error) return { data: [], error: error.message }
    return { data: (data || []) as TaxRecord[] }
  }

  async getCBKReportData(period: string): Promise<{ data: Record<string, any>; error?: string }> {
    const { data, error } = await supabase.rpc('get_cbk_report_data', { p_period: period })
    if (error) return { data: {}, error: error.message }
    return { data: data as Record<string, any> }
  }

  async generateCBKReport(period: string, reportType: string): Promise<{ report: CBKReport | null; error?: string }> {
    const { data: cbkData, error: cbkError } = await this.getCBKReportData(period)
    if (cbkError) return { report: null, error: cbkError }
    const { data, error } = await supabase.from('cbk_reports').insert({
      report_period: period, report_type: reportType, institution_code: 'MTAA001', data: cbkData, status: 'draft',
    }).select().single()
    if (error) return { report: null, error: error.message }
    return { report: data as CBKReport }
  }
}

export const complianceService = ComplianceService.getInstance()
