import { supabase } from '@/lib/supabase';
import type { Truck, Driver, Load, Route } from '@/lib/mtruck/types';

export async function list() {
  const { data, error } = await supabase.from('mtruck_trucks').select('*').limit(50);
  if (error) throw error;
  return data || [];
}
export async function getById(id: string) {
  const { data, error } = await supabase.from('mtruck_trucks').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
export async function create(payload: any) {
  const { data, error } = await supabase.from('mtruck_trucks').insert(payload).select().single();
  if (error) throw error;
  return data;
}
export async function update(id: string, payload: any) {
  const { data, error } = await supabase.from('mtruck_trucks').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
