import { supabase } from '@/lib/supabase';
import { PrisonProcurement } from '@/types/prisons';

export async function getProcurement(filters?: {
  facility_id?: string;
  status?: string;
  category?: string;
  urgency?: string;
}): Promise<PrisonProcurement[]> {
  let q = supabase.from('prison_procurement').select('*');
  if (filters?.facility_id) q = q.eq('facility_id', filters.facility_id);
  if (filters?.status) q = q.eq('status', filters.status);
  if (filters?.category) q = q.eq('category', filters.category);
  if (filters?.urgency) q = q.eq('urgency', filters.urgency);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createProcurement(item: Partial<PrisonProcurement>): Promise<PrisonProcurement> {
  const total = (item.quantity || 0) * (item.unit_cost || 0);
  const insert = { ...item, total_cost: total };
  const { data, error } = await supabase.from('prison_procurement').insert(insert).select().single();
  if (error) throw error;
  return data;
}

export async function updateProcurement(id: string, updates: Partial<PrisonProcurement>): Promise<PrisonProcurement> {
  if (updates.quantity && updates.unit_cost) updates.total_cost = updates.quantity * updates.unit_cost;
  const { data, error } = await supabase.from('prison_procurement').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
