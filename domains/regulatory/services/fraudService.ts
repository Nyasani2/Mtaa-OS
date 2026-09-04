/**
 * MTAA Regulatory — Fraud Service
 * Manages fraud flags, investigations, and risk scoring
 */

import { supabase } from '@/lib/supabase';
import { systemEventBus } from '@/lib/system/event-bus';

export interface FraudFlag {
  id: string
  transaction_id: string | null
  user_id: string
  flag_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'under_review' | 'resolved' | 'false_positive' | 'escalated'
  description: string
  evidence: Record<string, any>
  risk_score: number
  assigned_to: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  resolution_notes: string | null
  created_at: string
  updated_at: string
}

export interface FraudMetrics {
  total_flags: number
  open_flags: number
  resolved_flags: number
  false_positives: number
  by_severity: { critical: number; high: number; medium: number; low: number }
  by_type: Record<string, number>
  avg_resolution_time_hours: number
}

export interface FraudQuery {
  status?: string
  severity?: string
  flagType?: string
  userId?: string
  assignedTo?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

class FraudService {
  private static instance: FraudService

  static getInstance(): FraudService {
    if (!FraudService.instance) FraudService.instance = new FraudService()
    return FraudService.instance
  }

  async queryFlags(query: FraudQuery = {}): Promise<{ data: FraudFlag[]; count: number; error?: string }> {
    let sbQuery = supabase.from('regulatory_flags').select('*', { count: 'exact' })
    if (query.status) sbQuery = sbQuery.eq('status', query.status)
    if (query.severity) sbQuery = sbQuery.eq('severity', query.severity)
    if (query.flagType) sbQuery = sbQuery.eq('flag_type', query.flagType)
    if (query.userId) sbQuery = sbQuery.eq('user_id', query.userId)
    if (query.assignedTo) sbQuery = sbQuery.eq('assigned_to', query.assignedTo)
    if (query.startDate) sbQuery = sbQuery.gte('created_at', query.startDate)
    if (query.endDate) sbQuery = sbQuery.lte('created_at', query.endDate)
    sbQuery = sbQuery.order('created_at', { ascending: false })
    if (query.limit) sbQuery = sbQuery.limit(query.limit)
    if (query.offset) sbQuery = sbQuery.range(query.offset, query.offset + (query.limit || 50) - 1)
    const { data, error, count } = await sbQuery
    if (error) return { data: [], count: 0, error: error.message }
    return { data: (data || []) as FraudFlag[], count: count || 0 }
  }

  async getMetrics(days: number = 30): Promise<FraudMetrics> {
    const { data, error } = await supabase.rpc('get_fraud_metrics', { p_days: days })
    if (error) return {
      total_flags: 0, open_flags: 0, resolved_flags: 0, false_positives: 0,
      by_severity: { critical: 0, high: 0, medium: 0, low: 0 },
      by_type: {}, avg_resolution_time_hours: 0,
    }
    return data as FraudMetrics
  }

  async updateFlag(flagId: string, updates: {
    status?: string; assigned_to?: string; resolution_notes?: string; reviewed_by?: string
  }): Promise<{ success: boolean; error?: string }> {
    const updateData: any = { ...updates, updated_at: new Date().toISOString() }
    if (updates.status === 'resolved' || updates.status === 'false_positive') {
      updateData.reviewed_at = new Date().toISOString()
    }
    const { error } = await supabase.from('regulatory_flags').update(updateData).eq('id', flagId)
    if (error) return { success: false, error: error.message }
    systemEventBus.emit('system:regulatory:flagged', { flagId, status: updates.status, action: 'updated' }, { source: 'fraud-service' })
    return { success: true }
  }

  async getUserRiskScore(userId: string): Promise<{ score: number; flags: FraudFlag[] }> {
    const { data, error } = await supabase.from('regulatory_flags').select('*')
      .eq('user_id', userId).in('status', ['open', 'under_review', 'escalated'])
    if (error) return { score: 0, flags: [] }
    const flags = (data || []) as FraudFlag[]
    return { score: flags.reduce((sum, f) => sum + (f.risk_score || 0), 0), flags }
  }

  subscribeToFraud(callback: (flag: FraudFlag) => void): () => void {
    return systemEventBus.on('asis:fraud:**', (event) => callback(event.payload as FraudFlag))
  }
}

export const fraudService = FraudService.getInstance()
