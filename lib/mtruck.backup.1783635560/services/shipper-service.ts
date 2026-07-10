import { supabase } from '@/lib/supabase';
import type { ShipperRequest, HaulQuote, MtruckJob, TonnageCategory } from '@/lib/mtruck/types';

const TABLE_REQUESTS = 'mtruck_shipper_requests';
const TABLE_QUOTES = 'mtruck_haul_quotes';
const TABLE_JOBS = 'mtruck_jobs';

export const shipperService = {
  async createRequest(data: {
    shipperId: string;
    cargoType: string;
    tonnageCategory: TonnageCategory;
    weightKg: number;
    originAddress: string;
    originLat: number;
    originLng: number;
    destAddress: string;
    destLat: number;
    destLng: number;
    pickupDate: string;
    deliveryDeadline: string;
    urgency: 'normal' | 'express' | 'critical';
    specialRequirements?: string[];
  }): Promise<ShipperRequest> {
    const { data: req, error } = await supabase
      .from(TABLE_REQUESTS)
      .insert({
        shipper_id: data.shipperId,
        cargo_type: data.cargoType,
        tonnage_category: data.tonnageCategory,
        weight_kg: data.weightKg,
        origin_address: data.originAddress,
        origin_lat: data.originLat,
        origin_lng: data.originLng,
        dest_address: data.destAddress,
        dest_lat: data.destLat,
        dest_lng: data.destLng,
        pickup_date: data.pickupDate,
        delivery_deadline: data.deliveryDeadline,
        urgency: data.urgency,
        special_requirements: data.specialRequirements ?? [],
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw new Error(`Create request failed: ${error.message}`);
    return mapRequest(req);
  },

  async getMyRequests(shipperId: string): Promise<ShipperRequest[]> {
    const { data, error } = await supabase
      .from(TABLE_REQUESTS)
      .select(`*, ${TABLE_QUOTES}(*)`)
      .eq('shipper_id', shipperId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Fetch requests failed: ${error.message}`);
    return (data ?? []).map(mapRequest);
  },

  async getRequestWithQuotes(requestId: string): Promise<ShipperRequest> {
    const { data, error } = await supabase
      .from(TABLE_REQUESTS)
      .select(`*, ${TABLE_QUOTES}(*)`)
      .eq('id', requestId)
      .single();

    if (error) throw new Error(`Fetch request failed: ${error.message}`);
    return mapRequest(data);
  },

  async acceptQuote(quoteId: string, requestId: string): Promise<MtruckJob> {
    const { error: qe } = await supabase
      .from(TABLE_QUOTES)
      .update({ status: 'accepted' })
      .eq('id', quoteId);

    if (qe) throw new Error(`Accept quote failed: ${qe.message}`);

    await supabase
      .from(TABLE_QUOTES)
      .update({ status: 'rejected' })
      .eq('request_id', requestId)
      .neq('id', quoteId);

    await supabase
      .from(TABLE_REQUESTS)
      .update({ status: 'accepted' })
      .eq('id', requestId);

    const { data: req } = await supabase
      .from(TABLE_REQUESTS)
      .select(`*, ${TABLE_QUOTES}!inner(*)`)
      .eq('id', requestId)
      .single();

    const acceptedQuote = req.quotes.find((q: any) => q.id === quoteId);

    const { data: job, error: je } = await supabase
      .from(TABLE_JOBS)
      .insert({
        shipper_id: req.shipper_id,
        shipper_name: req.shipper_name ?? 'Shipper',
        shipper_phone: req.shipper_phone ?? '',
        cargo_type: req.cargo_type,
        tonnage_category: req.tonnage_category,
        weight_kg: req.weight_kg,
        origin: { lat: req.origin_lat, lng: req.origin_lng, address: req.origin_address },
        destination: { lat: req.dest_lat, lng: req.dest_lng, address: req.dest_address },
        pickup_date: req.pickup_date,
        delivery_deadline: req.delivery_deadline,
        urgency: req.urgency,
        quoted_rate: acceptedQuote?.estimated_cost ?? 0,
        final_rate: acceptedQuote?.estimated_cost ?? 0,
        currency: acceptedQuote?.currency ?? 'KES',
        assigned_driver_id: acceptedQuote?.carrier_id ?? null,
        status: 'accepted',
      })
      .select()
      .single();

    if (je) throw new Error(`Create job failed: ${je.message}`);
    return job;
  },

  async getMyJobs(shipperId: string): Promise<MtruckJob[]> {
    const { data, error } = await supabase
      .from(TABLE_JOBS)
      .select('*')
      .eq('shipper_id', shipperId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Fetch jobs failed: ${error.message}`);
    return data ?? [];
  },

  async trackJob(jobId: string): Promise<MtruckJob> {
    const { data, error } = await supabase
      .from(TABLE_JOBS)
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) throw new Error(`Track job failed: ${error.message}`);
    return data;
  },

  async cancelRequest(requestId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_REQUESTS)
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) throw new Error(`Cancel request failed: ${error.message}`);
  },
};

function mapRequest(row: any): ShipperRequest {
  return {
    id: row.id,
    shipper_id: row.shipper_id,
    cargo_type: row.cargo_type,
    tonnage_category: row.tonnage_category,
    weight_kg: row.weight_kg,
    origin_address: row.origin_address,
    origin_lat: row.origin_lat,
    origin_lng: row.origin_lng,
    dest_address: row.dest_address,
    dest_lat: row.dest_lat,
    dest_lng: row.dest_lng,
    pickup_date: row.pickup_date,
    delivery_deadline: row.delivery_deadline,
    urgency: row.urgency,
    special_requirements: row.special_requirements ?? [],
    status: row.status,
    quotes: (row.quotes ?? []).map((q: any) => ({
      id: q.id,
      request_id: q.request_id,
      carrier_id: q.carrier_id,
      carrier_name: q.carrier_name ?? 'Carrier',
      carrier_rating: q.carrier_rating ?? 0,
      estimated_cost: q.estimated_cost,
      currency: q.currency ?? 'KES',
      estimated_duration_hours: q.estimated_duration_hours ?? 0,
      truck_type: q.truck_type ?? 'unknown',
      includes_insurance: q.includes_insurance ?? false,
      notes: q.notes,
      status: q.status,
      created_at: q.created_at,
    })),
    created_at: row.created_at,
  };
}
