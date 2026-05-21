import { supabase } from '@/lib/supabase/client'
import { AuditLog } from '../types/command.types'

export async function fetchAuditLogs(
  tableName?: string,
  limit = 100
): Promise<AuditLog[]> {
  let q = supabase
    .from('treasury_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (tableName) q = q.eq('table_name', tableName)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function logAuditAction(
  action: string,
  tableName: string,
  recordId: string,
  oldData?: Record<string, unknown>,
  newData?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('treasury_audit_logs').insert({
    action,
    table_name: tableName,
    record_id: recordId,
    old_data: oldData,
    new_data: newData,
    created_at: new Date().toISOString()
  })
  if (error) throw error
}
