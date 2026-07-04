import { supabase } from '@/lib/supabase';
import { healthQR } from '../security/health-qr';
import { SharePermission } from '../types';

const TABLE_SHARES = 'health_shares';

export async function generateShareQR(
  patientId: string,
  hospitalId: string,
  scope: string[],
  expiryMinutes: number
): Promise<string> {
  return healthQR.generateShareRequest(patientId, hospitalId, scope, expiryMinutes);
}

export async function generateEmergencyQR(emergencyData: any): Promise<string> {
  return healthQR.generateEmergencyQR(emergencyData);
}

export async function scanAndProcessQR(qrData: string): Promise<{ valid: boolean; data?: any; error?: string }> {
  const result = await healthQR.scanQR(qrData);
  if (!result.valid) return { valid: false, error: result.error };

  if (result.type === 'share_request') {
    return { valid: true, data: { type: 'share_request', ...result.data } };
  }
  if (result.type === 'emergency') {
    return { valid: true, data: { type: 'emergency', ...result.data } };
  }
  if (result.type === 'identity') {
    return { valid: true, data: { type: 'identity', ...result.data } };
  }
  return { valid: false, error: 'Unknown QR type' };
}

export async function approveShareRequest(
  patientId: string,
  hospitalId: string,
  hospitalName: string,
  scope: string[],
  expiryMinutes: number
): Promise<SharePermission | null> {
  const now = new Date();
  const expires = new Date(now.getTime() + expiryMinutes * 60000);
  const share = {
    id: crypto.randomUUID(),
    patient_id: patientId,
    hospital_id: hospitalId,
    hospital_name: hospitalName,
    scope,
    granted_at: now.toISOString(),
    expires_at: expires.toISOString(),
    status: 'active',
  };
  const { data, error } = await supabase.from(TABLE_SHARES).insert(share).select().single();
  if (error || !data) return null;
  return {
    id: data.id,
    patientId: data.patient_id,
    hospitalId: data.hospital_id,
    hospitalName: data.hospital_name,
    scope: data.scope,
    grantedAt: data.granted_at,
    expiresAt: data.expires_at,
    revokedAt: data.revoked_at,
    status: data.status,
  };
}

export async function getActiveShares(patientId: string): Promise<SharePermission[]> {
  const { data, error } = await supabase
    .from(TABLE_SHARES)
    .select('*')
    .eq('patient_id', patientId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('granted_at', { ascending: false });
  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.id,
    patientId: row.patient_id,
    hospitalId: row.hospital_id,
    hospitalName: row.hospital_name,
    scope: row.scope,
    grantedAt: row.granted_at,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    status: row.status,
  }));
}

export async function revokeShare(shareId: string): Promise<boolean> {
  const { error } = await supabase
    .from(TABLE_SHARES)
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('id', shareId);
  return !error;
}

export async function cleanupExpiredShares(): Promise<number> {
  const { data, error } = await supabase
    .from(TABLE_SHARES)
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString())
    .select();
  if (error || !data) return 0;
  return data.length;
}
