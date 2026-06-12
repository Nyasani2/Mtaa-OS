import { supabase } from '@/lib/supabase';
import { EducationQRSession, EducationQRScan } from '../types/education.types';

export const qrSessionService = {
  /**
   * Generate a new QR session via edge function
   */
  async generateQR(payload: {
    qr_type: string;
    target_id?: string;
    target_type?: string;
    institution_id?: string;
    class_id?: string;
    valid_minutes?: number;
    max_scans?: number;
    generated_by: string;
    generated_by_role: string;
  }): Promise<EducationQRSession> {
    const { data, error } = await supabase.functions.invoke('generate-education-qr', { body: payload });
    if (error) throw new Error(error.message);
    return data.data as EducationQRSession;
  },

  /**
   * Scan/validate a QR code
   */
  async scanQR(payload: {
    session_id: string;
    scanned_by: string;
    scanned_by_role: string;
    location?: { lat: number; lng: number; accuracy?: number };
    device_info?: { os?: string; model?: string; app_version?: string };
  }): Promise<{ valid: boolean; reason: string; session?: EducationQRSession }> {
    const { data, error } = await supabase.functions.invoke('scan-education-qr', { body: payload });
    if (error) throw new Error(error.message);
    return data.data;
  },

  /**
   * Get QR sessions by generator
   */
  async getByGenerator(userId: string, options?: {
    status?: string;
    qr_type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: EducationQRSession[]; count: number }> {
    let query = supabase
      .from('education_qr_sessions')
      .select('*', { count: 'exact' })
      .eq('generated_by', userId)
      .order('created_at', { ascending: false });

    if (options?.status) query = query.eq('status', options.status);
    if (options?.qr_type) query = query.eq('qr_type', options.qr_type);
    if (options?.limit) {
      query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: (data || []) as EducationQRSession[], count: count || 0 };
  },

  /**
   * Get active sessions for a target
   */
  async getActiveByTarget(targetId: string, targetType: string): Promise<EducationQRSession[]> {
    const { data, error } = await supabase
      .from('education_qr_sessions')
      .select('*')
      .eq('target_id', targetId)
      .eq('target_type', targetType)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as EducationQRSession[];
  },

  /**
   * Revoke a session
   */
  async revokeSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('education_qr_sessions')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) throw new Error(error.message);
  },

  /**
   * Get scan history for a session
   */
  async getScanHistory(sessionId: string): Promise<EducationQRScan[]> {
    const { data, error } = await supabase
      .from('education_qr_scans')
      .select(`
        *,
        scanner:scanned_by (id, raw_user_meta_data)
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as EducationQRScan[];
  },

  /**
   * Get scan statistics for an institution
   */
  async getScanStats(institutionId: string, period?: { from: string; to: string }): Promise<{
    total_scans: number;
    successful: number;
    failed: number;
    by_type: Record<string, number>;
    by_scanner_role: Record<string, number>;
  }> {
    let query = supabase
      .from('education_qr_scans')
      .select(`
        scan_result,
        scanned_by_role,
        session:session_id (qr_type)
      `)
      .eq('session.institution_id', institutionId);

    if (period) {
      query = query.gte('created_at', period.from).lte('created_at', period.to);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const stats = { total_scans: 0, successful: 0, failed: 0, by_type: {} as Record<string, number>, by_scanner_role: {} as Record<string, number> };
    (data || []).forEach((scan: any) => {
      stats.total_scans++;
      if (scan.scan_result === 'success') stats.successful++;
      else stats.failed++;
      const type = scan.session?.qr_type || 'unknown';
      stats.by_type[type] = (stats.by_type[type] || 0) + 1;
      stats.by_scanner_role[scan.scanned_by_role] = (stats.by_scanner_role[scan.scanned_by_role] || 0) + 1;
    });

    return stats;
  },
};
