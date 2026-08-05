import { supabase } from '@/lib/supabase';

export async function getShopItems(shopId?: string) {
  let q = supabase.from('shop_items').select('*');
  if (shopId) q = q.eq('shop_id', shopId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function createShopOrder(order: any) {
  const { data, error } = await supabase.from('shop_orders').insert(order).select().maybeSingle();
  if (error) throw error;
  return data;
}
