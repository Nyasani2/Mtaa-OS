import { supabase } from '@/lib/supabase';
import type { ShipperRequest, HaulQuote, MtruckJob, TonnageCategory } from '@/lib/mtruck/types';

const TABLE_REQUESTS = 'mtruck_shipper_requests';
const TABLE_QUOTES = 'mtruck_haul_quotes';
const TABLE_JOBS = 'mtruck_jobs';

function mapRequest(row: any): ShipperRequest {
  return {
    id: row.id,
    shipperId: row.shipper_id,
    cargoType: row.cargo_type,
    tonnageCategory: row.tonnage_category,
    weightKg: row.weight_kg,
    originAddress: row.origin_address,
    originLat: row.origin_lat,
    originLng: row.origin_lng,
    destAddress: row.dest_address,
    destLat: row.dest_lat,
    destLng: row.dest_lng,
    pickupDate: row.pickup_date,
    deliveryDeadline: row.delivery_deadline,
    urgency: row.urgency,
    specialRequirements: row.special_requirements ?? [],
    status: row.status,
    quotes: (row.mtruck_haul_quotes ?? row.quotes ?? []).map(mapQuote),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapQuote(row: any): HaulQuote {
  return {
    id: row.id,
    requestId: row.request_id,
    carrierId: row.carrier_id,
    carrierName: row.carrier_name,
    carrierRating: row.carrier_rating,
    estimatedCost: row.estimated_cost,
    currency: row.currency,
    estimatedDays: row.estimated_days,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
  };
}

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
      .select(`*, mtruck_haul_quotes(*)`)
      .eq('shipper_id', shipperId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Fetch requests failed: ${error.message}`);
    return (data ?? []).map(mapRequest);
  },

  async getRequestWithQuotes(requestId: string): Promise<ShipperRequest> {
    const { data, error } = await supabase
      .from(TABLE_REQUESTS)
      .select(`*, mtruck_haul_quotes(*)`)
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
      .select(`*, mtruck_haul_quotes!inner(*)`)
      .eq('id', requestId)
      .single();

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
      .single();

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

  async cancelRequest(requestId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_REQUESTS)
      .update({ status: 'cancelled' })
      .eq('id', requestId);

    if (error) throw new Error(`Cancel request failed: ${error.message}`);
  },

  async getQuotesForRequest(requestId: string): Promise<HaulQuote[]> {
    const { data, error } = await supabase
      .from(TABLE_QUOTES)
      .select('*')
      .eq('request_id', requestId)
      .order('estimated_cost', { ascending: true });

    if (error) throw new Error(`Fetch quotes failed: ${error.message}`);
    return (data ?? []).map(mapQuote);
  },

  async submitQuote(data: {
    requestId: string;
    carrierId: string;
    carrierName: string;
    carrierRating: number;
    estimatedCost: number;
    currency: string;
    estimatedDays: number;
    notes?: string;
  }): Promise<HaulQuote> {
    const { data: quote, error } = await supabase
      .from(TABLE_QUOTES)
      .insert({
        request_id: data.requestId,
        carrier_id: data.carrierId,
        carrier_name: data.carrierName,
        carrier_rating: data.carrierRating,
        estimated_cost: data.estimatedCost,
        currency: data.currency,
        estimated_days: data.estimatedDays,
        notes: data.notes ?? '',
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw new Error(`Submit quote failed: ${error.message}`);
    return mapQuote(quote);
  },
};
