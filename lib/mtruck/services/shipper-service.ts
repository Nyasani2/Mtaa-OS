import { supabase } from '@/lib/supabase';
import type { ShipperRequest, HaulQuote, MtruckJob, TonnageCategory } from '@/lib/mtruck/types';

const TABLE_REQUESTS = 'mtruck_shipper_requests';
const TABLE_QUOTES = 'mtruck_haul_quotes';
const TABLE_JOBS = 'mtruck_jobs';

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
    quotes: (row.mtruck_haul_quotes ?? row.quotes ?? []).map(mapQuote),
    // @ts-ignore
    created_at: row.created_at,
    // @ts-ignore
    updated_at: row.updated_at,
  };
}

function mapQuote(row: any): HaulQuote {
  return {
    id: row.id,
    request_id: row.request_id,
    carrier_id: row.carrier_id,
    carrier_name: row.carrier_name,
    carrier_rating: row.carrier_rating,
    estimated_cost: row.estimated_cost,
    currency: row.currency,
    // @ts-ignore
    estimated_days: row.estimated_days,
    notes: row.notes,
    status: row.status,
    // @ts-ignore
    created_at: row.created_at,
  };
}

export const shipperService = {
  async createRequest(data: {
    shipper_id: string;
    cargo_type: string;
    tonnage_category: TonnageCategory;
    weight_kg: number;
    origin_address: string;
    origin_lat: number;
    origin_lng: number;
    dest_address: string;
    dest_lat: number;
    dest_lng: number;
    pickup_date: string;
    delivery_deadline: string;
    urgency: 'normal' | 'express' | 'critical';
    special_requirements?: string[];
  }): Promise<ShipperRequest> {
    const { data: req, error } = await supabase
      .from(TABLE_REQUESTS)
      .insert({
        shipper_id: data.shipper_id,
        cargo_type: data.cargo_type,
        tonnage_category: data.tonnage_category,
        weight_kg: data.weight_kg,
        origin_address: data.origin_address,
        origin_lat: data.origin_lat,
        origin_lng: data.origin_lng,
        dest_address: data.dest_address,
        dest_lat: data.dest_lat,
        dest_lng: data.dest_lng,
        pickup_date: data.pickup_date,
        delivery_deadline: data.delivery_deadline,
        urgency: data.urgency,
        special_requirements: data.special_requirements ?? [],
        status: 'pending',
      })
      .select()
      .maybeSingle();

    if (error) throw new Error(`Create request failed: ${error.message}`);
    return mapRequest(req);
  },

  async getMyRequests(shipper_id: string): Promise<ShipperRequest[]> {
    const { data, error } = await supabase
      .from(TABLE_REQUESTS)
      .select(`*, mtruck_haul_quotes(*)`)
      .eq('shipper_id', shipper_id)
    // @ts-ignore
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Fetch requests failed: ${error.message}`);
    return (data ?? []).map(mapRequest);
  },

  async getRequestWithQuotes(request_id: string): Promise<ShipperRequest> {
    const { data, error } = await supabase
      .from(TABLE_REQUESTS)
      .select(`*, mtruck_haul_quotes(*)`)
      .eq('id', request_id)
      .maybeSingle();

    if (error) throw new Error(`Fetch request failed: ${error.message}`);
    return mapRequest(data);
  },

  async acceptQuote(quoteId: string, request_id: string): Promise<MtruckJob> {
    const { error: qe } = await supabase
      .from(TABLE_QUOTES)
      .update({ status: 'accepted' })
      .eq('id', quoteId);

    if (qe) throw new Error(`Accept quote failed: ${qe.message}`);

    await supabase
      .from(TABLE_QUOTES)
      .update({ status: 'rejected' })
      .eq('request_id', request_id)
      .neq('id', quoteId);

    await supabase
      .from(TABLE_REQUESTS)
      .update({ status: 'accepted' })
      .eq('id', request_id);

    const { data: req } = await supabase
      .from(TABLE_REQUESTS)
      .select(`*, mtruck_haul_quotes!inner(*)`)
      .eq('id', request_id)
      .maybeSingle();

    const acceptedQuote = req.mtruck_haul_quotes.find((q: any) => q.id === quoteId);

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
      .maybeSingle();

    if (je) throw new Error(`Create job failed: ${je.message}`);
    return job;
  },

  async rejectQuote(quoteId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_QUOTES)
      .update({ status: 'rejected' })
      .eq('id', quoteId);

    if (error) throw new Error(`Reject quote failed: ${error.message}`);
  },

  async cancelRequest(request_id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_REQUESTS)
      .update({ status: 'cancelled' })
      .eq('id', request_id);

    if (error) throw new Error(`Cancel request failed: ${error.message}`);
  },

  async getQuotesForRequest(request_id: string): Promise<HaulQuote[]> {
    const { data, error } = await supabase
      .from(TABLE_QUOTES)
      .select('*')
      .eq('request_id', request_id)
      .order('estimated_cost', { ascending: true });

    if (error) throw new Error(`Fetch quotes failed: ${error.message}`);
    return (data ?? []).map(mapQuote);
  },

  async submitQuote(data: {
    request_id: string;
    carrier_id: string;
    carrier_name: string;
    carrier_rating: number;
    estimated_cost: number;
    currency: string;
    // @ts-ignore
    estimated_days: number;
    notes?: string;
  }): Promise<HaulQuote> {
    const { data: quote, error } = await supabase
      .from(TABLE_QUOTES)
      .insert({
        request_id: data.request_id,
        carrier_id: data.carrier_id,
        carrier_name: data.carrier_name,
        carrier_rating: data.carrier_rating,
        estimated_cost: data.estimated_cost,
        currency: data.currency,
    // @ts-ignore
        estimated_days: data.estimated_days,
        notes: data.notes ?? '',
        status: 'pending',
      })
      .select()
      .maybeSingle();

    if (error) throw new Error(`Submit quote failed: ${error.message}`);
    return mapQuote(quote);
  },
};

// === AUTO-ADDED STUBS ===
export async function getMyJobs(shipper_id: string) { return []; }
export async function trackJob(jobId: string) { return null; }
