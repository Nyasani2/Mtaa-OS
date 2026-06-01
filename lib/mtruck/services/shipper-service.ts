import { supabase } from '@/lib/supabase/client';
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

    const acceptedQuote = req.mtruck_haul_quotes.find((q: any) => q.id === quoteId);

    const { data: job, error: je } = await supabase
      .from(TABLE_JOBS)
      .insert({
        shipper_id: req.shipper_id,
        cargo_type: req.cargo_type,
        tonnage_category: req.tonnage_category,
        weight_kg: req.weight_kg,
        origin: { lat: req.origin_lat, lng: req.origin_lng, address: req.origin_address, name: req.origin_address },
        destination: { lat: req.dest_lat, lng: req.dest_lng, address: req.dest_address, name: req.dest_address },
        pickup_date: req.pickup_date,
        delivery_deadline: req.delivery_deadline,
        urgency: req.urgency,
        quoted_rate: acceptedQuote.rate,
        final_rate: acceptedQuote.rate,
        currency: acceptedQuote.currency,
        assigned_truck_id: null,
        assigned_driver_id: null,
        status: 'accepted',
      })
      .select()
      .single();

    if (je) throw new Error(`Create job failed: ${je.message}`);
    return mapJob(job);
  },

  async getMyJobs(shipperId: string): Promise<MtruckJob[]> {
    const { data, error } = await supabase
      .from(TABLE_JOBS)
      .select('*')
      .eq('shipper_id', shipperId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Fetch jobs failed: ${error.message}`);
    return (data ?? []).map(mapJob);
  },

  async trackJob(jobId: string): Promise<MtruckJob> {
    const { data, error } = await supabase
      .from(TABLE_JOBS)
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) throw new Error(`Track job failed: ${error.message}`);
    return mapJob(data);
  },

  async cancelRequest(requestId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_REQUESTS)
      .update({ status: 'rejected' })
      .eq('id', requestId)
      .eq('status', 'pending');

    if (error) throw new Error(`Cancel request failed: ${error.message}`);
  },
};

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
    quotes: (row.mtruck_haul_quotes ?? []).map(mapQuote),
    createdAt: row.created_at,
  };
}

function mapQuote(row: any): HaulQuote {
  return {
    id: row.id,
    requestId: row.request_id,
    fleetId: row.fleet_id,
    fleetName: row.fleet_name,
    rate: row.rate,
    currency: row.currency,
    estimatedHours: row.estimated_hours,
    truckType: row.truck_type,
    equipmentIncluded: row.equipment_included ?? [],
    insuranceIncluded: row.insurance_included,
    expiryTime: row.expiry_time,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapJob(row: any): MtruckJob {
  return {
    id: row.id,
    shipperId: row.shipper_id,
    shipperName: row.shipper_name ?? '',
    shipperPhone: row.shipper_phone ?? '',
    cargoType: row.cargo_type,
    tonnageCategory: row.tonnage_category,
    weightKg: row.weight_kg,
    dimensions: row.dimensions,
    hazardous: row.hazardous ?? false,
    fragile: row.fragile ?? false,
    temperatureControlled: row.temperature_controlled ?? false,
    origin: row.origin,
    destination: row.destination,
    distanceKm: row.distance_km ?? 0,
    pickupDate: row.pickup_date,
    deliveryDeadline: row.delivery_deadline,
    urgency: row.urgency,
    quotedRate: row.quoted_rate,
    finalRate: row.final_rate,
    currency: row.currency ?? 'ZAR',
    assignedTruckId: row.assigned_truck_id,
    assignedDriverId: row.assigned_driver_id,
    assignedEquipmentIds: row.assigned_equipment_ids ?? [],
    status: row.status,
    currentLocation: row.current_location,
    etaMinutes: row.eta_minutes,
    createdAt: row.created_at,
    quotedAt: row.quoted_at,
    acceptedAt: row.accepted_at,
    pickupAt: row.pickup_at,
    deliveredAt: row.delivered_at,
    completedAt: row.completed_at,
    shipperRating: row.shipper_rating,
    driverRating: row.driver_rating,
    shipperReview: row.shipper_review,
    driverReview: row.driver_review,
    documents: row.documents ?? [],
  };
}
