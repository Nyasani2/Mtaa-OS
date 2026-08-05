import { supabase } from "@/lib/supabase";
import type { MtruckTradeCorridor } from "@/lib/mtruck/types";

const TABLE_ADDRESSES = 'saved_addresses';
const TABLE_CORRIDORS = 'mtruck_trade_corridors';

export async function getSavedAddresses(userId: string) {
  const { data, error } = await supabase
    .from(TABLE_ADDRESSES)
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveAddress(payload: {
  user_id: string;
  label: string;
  address_line?: string;
  city?: string;
  lat?: number;
  lng?: number;
  is_default?: boolean;
}) {
  const { data, error } = await supabase.from(TABLE_ADDRESSES).insert(payload).select().maybeSingle();
  if (error) throw error;
  return data;
}

// ── TRADE CORRIDORS ──

export async function getTradeCorridors(activeOnly = true): Promise<MtruckTradeCorridor[]> {
  let query = supabase.from(TABLE_CORRIDORS).select('*');
  if (activeOnly) query = query.eq('active', true);
  const { data, error } = await query.order('corridor_name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getCorridorByRoute(origin: string, destination: string): Promise<MtruckTradeCorridor | null> {
  const { data, error } = await supabase
    .from(TABLE_CORRIDORS)
    .select('*')
    .eq('origin_city', origin)
    .eq('destination_city', destination)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}
