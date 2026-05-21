import { supabase } from '@/lib/supabase';
import { CourtProcurement } from '@/types/courts';

export async function getProcurement(filters?: {
  court_house_id?: string;
  status?: string;
  category?: string;
}): Promise<CourtProcurement[]> {
  let q = supabase.from('court_procurement').select('*');
  if (filters?.court_house_id) q = q.eq('court_house_id', filters.court_house_id);
  if (filters?.status) q = q.eq('status', filters.status);
  if (filters?.category) q = q.eq('category', filters.category);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createProcurement(item: Partial<CourtProcurement>): Promise<CourtProcurement> {
  const total = (item.quantity || 0) * (item.unit_cost || 0);
  const insert = { ...item, total_cost: total };
  const { data, error } = await supabase.from('court_procurement').insert(insert).select().single();
  if (error) throw error;
  return data;
}

export async function updateProcurement(id: string, updates: Partial<CourtProcurement>): Promise<CourtProcurement> {
  if (updates.quantity && updates.unit_cost) {
    updates.total_cost = updates.quantity * updates.unit_cost;
  }
  const { data, error } = await supabase.from('court_procurement').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
