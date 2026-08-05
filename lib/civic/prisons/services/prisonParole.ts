import { supabase } from '@/lib/supabase';
import { PrisonParoleReview } from '../types';

export class PrisonParoleService {
  static async getParoleReviews(inmateId?: string): Promise<PrisonParoleReview[]> {
    let query = supabase.from('prison_parole_reviews').select('*, inmate:prison_inmates(*)');
    if (inmateId) query = query.eq('inmate_id', inmateId);
    const { data, error } = await query.order('review_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async createReview(data: Partial<PrisonParoleReview>): Promise<PrisonParoleReview> {
    const { data: result, error } = await supabase.from('prison_parole_reviews').insert(data).select().maybeSingle();
    if (error) throw error;
    return result;
  }

  static async updateReview(id: string, data: Partial<PrisonParoleReview>): Promise<PrisonParoleReview> {
    const { data: result, error } = await supabase.from('prison_parole_reviews').update(data).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return result;
  }
}
