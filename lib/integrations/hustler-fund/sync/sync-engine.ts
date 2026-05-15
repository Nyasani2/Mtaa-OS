import { supabase } from '@/lib/supabase';
import { HustlerFundClient } from '../hustler-fund-client';

export async function syncHustlerFund(user_id: string) {
  const client = new HustlerFundClient();

  const records = await client.fetchUserHistory(user_id);
  const normalized = client.normalize(records);

  const { error } = await supabase
    .from('external_credit_history')
    .insert(normalized);

  if (error) throw error;

  return { synced: true, count: normalized.length };
}
