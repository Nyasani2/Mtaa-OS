import { supabase } from '@/lib/supabase';
import { PrisonParoleReview } from '@/types/prisons';

export async function getParoleReviews(filters?: {
  inmate_id?: string;
  decision?: string;
}): Promise<PrisonParoleReview[]> {
  let q = supabase.from('prison_parole_reviews').select(`*, prison_inmates:inmate_id(*)`);
  if (filters?.inmate_id) q = q.eq('inmate_id', filters.inmate_id);
  if (filters?.decision) q = q.eq('decision', filters.decision);
  const { data, error } = await q.order('review_date', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, inmate: d.prison_inmates }));
}

export async function createParoleReview(review: Partial<PrisonParoleReview>): Promise<PrisonParoleReview> {
  const { data, error } = await supabase.from('prison_parole_reviews').insert(review).select().single();
  if (error) throw error;
  return data;
}

export async function updateParoleReview(id: string, updates: Partial<PrisonParoleReview>): Promise<PrisonParoleReview> {
  const { data, error } = await supabase.from('prison_parole_reviews').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function makeParoleDecision(id: string, decision: string, conditions: string[]): Promise<PrisonParoleReview> {
  const { data, error } = await supabase
    .from('prison_parole_reviews')
    .update({ decision, conditions, next_review_date: decision === 'deferred' ? new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0] : null })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  // Update inmate parole status if granted/denied
  if (decision === 'granted' || decision === 'denied') {
    const review = data;
    await supabase.from('prison_inmates').update({ parole_status: decision === 'granted' ? 'granted' : 'denied' }).eq('id', review.inmate_id);
  }
  return data;
}
