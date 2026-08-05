import { supabase } from '@/lib/supabase';

export interface PharmacyInput {
  name: string;
  type: 'chemist' | 'pharmacy' | 'herbal' | 'hospital' | 'clinic';
  address?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  license_number?: string;
  hours?: string;
  is_open?: boolean;
}

export interface PharmacyRecord {
  id: string;
  name: string;
  type: string;
  address?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  license_number?: string;
  hours?: string;
  is_open?: boolean;
  rating?: number;
  created_at: string;
}

export const PharmacyService = {
  async list(options?: { type?: string; search?: string; limit?: number }) {
    let q = supabase
      .from('health_pharmacies')
      .select('*')
      .order('name', { ascending: true });

    if (options?.type) q = q.eq('type', options.type);
    if (options?.search) q = q.ilike('name', `%${options.search}%`);
    if (options?.limit) q = q.limit(options.limit);

    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as PharmacyRecord[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('health_pharmacies')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as PharmacyRecord;
  },

  async create(input: PharmacyInput) {
    const { data, error } = await supabase
      .from('health_pharmacies')
      .insert({
        name: input.name,
        type: input.type,
        address: input.address,
        phone: input.phone,
        email: input.email,
        latitude: input.latitude,
        longitude: input.longitude,
        license_number: input.license_number,
        hours: input.hours,
        is_open: input.is_open ?? true,
        created_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as PharmacyRecord;
  },

  async update(id: string, input: Partial<PharmacyInput>) {
    const { data, error } = await supabase
      .from('health_pharmacies')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as PharmacyRecord;
  },

  async delete(id: string) {
    const { error } = await supabase.from('health_pharmacies').delete().eq('id', id);
    if (error) throw error;
  },

  async getNearby(lat: number, lng: number, radiusKm: number = 10) {
    // Use PostGIS if available, otherwise fetch all and filter
    const { data, error } = await supabase
      .from('health_pharmacies')
      .select('*')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (error) throw error;

    const R = 6371;
    const filtered = (data || []).filter((p: any) => {
      if (!p.latitude || !p.longitude) return false;
      const dLat = ((p.latitude - lat) * Math.PI) / 180;
      const dLon = ((p.longitude - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((p.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c <= radiusKm;
    });

    return filtered as PharmacyRecord[];
  },
};
