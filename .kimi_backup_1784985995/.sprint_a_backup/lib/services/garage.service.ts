import { supabase } from '@/lib/supabase';

// ─── Types ───

export interface Garage {
  id: string;
  owner_id: string;
  business_name: string;
  registration_number?: string;
  tax_id?: string;
  kra_pin?: string;
  email: string;
  phone?: string;
  website?: string;
  description?: string;
  logo_url?: string;
  cover_image_url?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  county?: string;
  state?: string;
  postal_code?: string;
  country: string;
  lat?: number;
  lng?: number;
  operating_hours: Record<string, { open: string; close: string; closed?: boolean }>;
  garage_types: string[];
  specializations: string[];
  status: 'pending' | 'under_review' | 'approved' | 'suspended' | 'rejected';
  verification_documents: any[];
  verified_at?: string;
  verified_by?: string;
  rejection_reason?: string;
  rating: number;
  review_count: number;
  total_revenue: number;
  total_jobs: number;
  active_jobs: number;
  completed_jobs: number;
  cancelled_jobs: number;
  number_of_bays: number;
  years_in_operation: number;
  accepts_walk_ins: boolean;
  accepts_appointments: boolean;
  emergency_service: boolean;
  pickup_dropoff: boolean;
  mobile_mechanic: boolean;
  subscription_tier: string;
  subscription_amount: number;
  subscription_expires_at?: string;
  subscription_status: string;
  commission_rate: number;
  asis_enabled: boolean;
  asis_config: Record<string, any>;
  wallet_balance: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface GarageFilters {
  status?: string;
  city?: string;
  county?: string;
  specialization?: string;
  garage_type?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  accepts_appointments?: boolean;
  emergency_service?: boolean;
  min_rating?: number;
  limit?: number;
  offset?: number;
}

export interface GarageStats {
  totalAppointments: number;
  completedJobs: number;
  pendingJobs: number;
  activeJobs: number;
  cancelledJobs: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  averageRating: number;
  totalReviews: number;
  lowStockItems: number;
  outOfStockItems: number;
  mechanicsCount: number;
  fleetContracts: number;
}

// ─── CRUD Operations ───

export async function registerGarage(garageData: Omit<Garage, 'id' | 'owner_id' | 'status' | 'rating' | 'review_count' | 'total_revenue' | 'total_jobs' | 'active_jobs' | 'completed_jobs' | 'cancelled_jobs' | 'wallet_balance' | 'created_at' | 'updated_at'>) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('garages')
    .insert({
      ...garageData,
      owner_id: user.user.id,
      status: 'pending',
      rating: 0,
      review_count: 0,
      total_revenue: 0,
      total_jobs: 0,
      active_jobs: 0,
      completed_jobs: 0,
      cancelled_jobs: 0,
      wallet_balance: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Garage;
}

export async function getGarages(filters?: GarageFilters) {
  let query = supabase.from('garages').select('*');

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.city) query = query.ilike('city', `%${filters.city}%`);
  if (filters?.county) query = query.ilike('county', `%${filters.county}%`);
  if (filters?.specialization) query = query.contains('specializations', [filters.specialization]);
  if (filters?.garage_type) query = query.contains('garage_types', [filters.garage_type]);
  if (filters?.accepts_appointments !== undefined) query = query.eq('accepts_appointments', filters.accepts_appointments);
  if (filters?.emergency_service !== undefined) query = query.eq('emergency_service', filters.emergency_service);
  if (filters?.min_rating) query = query.gte('rating', filters.min_rating);

  // Geo search (approximate bounding box)
  if (filters?.lat && filters?.lng && filters?.radius_km) {
    const latDelta = filters.radius_km / 111;
    const lngDelta = filters.radius_km / (111 * Math.cos(filters.lat * Math.PI / 180));
    query = query
      .gte('lat', filters.lat - latDelta)
      .lte('lat', filters.lat + latDelta)
      .gte('lng', filters.lng - lngDelta)
      .lte('lng', filters.lng + lngDelta);
  }

  query = query.order('rating', { ascending: false });

  if (filters?.limit) query = query.limit(filters.limit);
  if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Garage[];
}

export async function getGarageById(id: string) {
  const { data, error } = await supabase
    .from('garages')
    .select(`
      *,
      mechanics:garage_mechanics(*),
      services:garage_services(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Garage & { mechanics: any[]; services: any[] };
}

export async function getMyGarage() {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('garages')
    .select('*')
    .eq('owner_id', user.user.id)
    .maybeSingle();

  if (error) throw error;
  return data as Garage | null;
}

export async function updateGarage(id: string, updates: Partial<Garage>) {
  const { data, error } = await supabase
    .from('garages')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Garage;
}

// ─── Document Upload ───

export async function uploadVerificationDocument(garageId: string, file: File) {
  const fileName = `garage-docs/${garageId}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('garage-documents')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('garage-documents')
    .getPublicUrl(fileName);

  const { data: garage } = await supabase
    .from('garages')
    .select('verification_documents')
    .eq('id', garageId)
    .single();

  const docs = garage?.verification_documents || [];
  docs.push({
    name: file.name,
    url: urlData.publicUrl,
    uploaded_at: new Date().toISOString(),
  });

  const { data, error } = await supabase
    .from('garages')
    .update({ verification_documents: docs })
    .eq('id', garageId)
    .select()
    .single();

  if (error) throw error;
  return data as Garage;
}

// ─── Admin Operations ───

export async function approveGarage(garageId: string) {
  const { data: user } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('garages')
    .update({
      status: 'approved',
      verified_at: new Date().toISOString(),
      verified_by: user.user?.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', garageId)
    .select()
    .single();

  if (error) throw error;
  return data as Garage;
}

export async function rejectGarage(garageId: string, reason: string) {
  const { data, error } = await supabase
    .from('garages')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', garageId)
    .select()
    .single();

  if (error) throw error;
  return data as Garage;
}

export async function suspendGarage(garageId: string, reason: string) {
  const { data, error } = await supabase
    .from('garages')
    .update({
      status: 'suspended',
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', garageId)
    .select()
    .single();

  if (error) throw error;
  return data as Garage;
}

// ─── Stats ───

export async function getGarageStats(garageId: string): Promise<GarageStats> {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Appointments
  const { data: appointments, error: apptError } = await supabase
    .from('garage_appointments')
    .select('status, final_cost, estimated_cost, created_at')
    .eq('garage_id', garageId);

  if (apptError) throw apptError;

  // Reviews
  const { data: reviews, error: reviewError } = await supabase
    .from('garage_reviews')
    .select('overall_rating')
    .eq('garage_id', garageId)
    .eq('is_visible', true);

  if (reviewError) throw reviewError;

  // Inventory
  const { data: inventory, error: invError } = await supabase
    .from('garage_inventory')
    .select('status')
    .eq('garage_id', garageId);

  if (invError) throw invError;

  // Mechanics
  const { count: mechanicsCount, error: mechError } = await supabase
    .from('garage_mechanics')
    .select('*', { count: 'exact', head: true })
    .eq('garage_id', garageId)
    .eq('status', 'active');

  if (mechError) throw mechError;

  // Fleet contracts
  const { count: fleetCount, error: fleetError } = await supabase
    .from('garage_fleet_contracts')
    .select('*', { count: 'exact', head: true })
    .eq('garage_id', garageId)
    .eq('status', 'active');

  if (fleetError) throw fleetError;

  const completed = appointments?.filter(a => a.status === 'completed') || [];
  const pending = appointments?.filter(a => ['pending', 'confirmed', 'vehicle_received', 'diagnosing', 'awaiting_approval'].includes(a.status)) || [];
  const active = appointments?.filter(a => ['in_progress', 'waiting_parts', 'quality_check'].includes(a.status)) || [];
  const cancelled = appointments?.filter(a => a.status === 'cancelled') || [];

  const revenueToday = completed
    .filter(a => a.created_at?.startsWith(today))
    .reduce((sum, a) => sum + (a.final_cost || a.estimated_cost || 0), 0);

  const revenueWeek = completed
    .filter(a => a.created_at && a.created_at >= weekAgo)
    .reduce((sum, a) => sum + (a.final_cost || a.estimated_cost || 0), 0);

  const revenueMonth = completed
    .filter(a => a.created_at && a.created_at >= monthAgo)
    .reduce((sum, a) => sum + (a.final_cost || a.estimated_cost || 0), 0);

  return {
    totalAppointments: appointments?.length || 0,
    completedJobs: completed.length,
    pendingJobs: pending.length,
    activeJobs: active.length,
    cancelledJobs: cancelled.length,
    revenueToday,
    revenueThisWeek: revenueWeek,
    revenueThisMonth: revenueMonth,
    averageRating: reviews?.length
      ? reviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / reviews.length
      : 0,
    totalReviews: reviews?.length || 0,
    lowStockItems: inventory?.filter(i => i.status === 'low_stock').length || 0,
    outOfStockItems: inventory?.filter(i => i.status === 'out_of_stock').length || 0,
    mechanicsCount: mechanicsCount || 0,
    fleetContracts: fleetCount || 0,
  };
}

// ─── Subscription Plans ───

export const GARAGE_SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Basic listing, walk-ins only',
    features: ['Basic profile', 'Walk-in customers', 'Standard support'],
    limits: { max_mechanics: 1, max_bays: 1, commission_rate: 15 },
  },
  {
    id: 'boda',
    name: 'Boda Garage',
    price: 5000,
    billing: 'monthly',
    description: 'Motorcycle specialists',
    features: ['Motorcycle repairs', 'Appointment booking', 'Priority support', 'ASIS diagnostics'],
    limits: { max_mechanics: 3, max_bays: 2, commission_rate: 12 },
  },
  {
    id: 'taxi',
    name: 'Taxi Garage',
    price: 10000,
    billing: 'monthly',
    description: 'Cars, SUVs, pickups, vans',
    features: ['All vehicle types', 'Fleet management', 'Insurance claims', 'Roadworthy certs'],
    limits: { max_mechanics: 10, max_bays: 5, commission_rate: 10 },
  },
  {
    id: 'truck',
    name: 'Truck Garage',
    price: 20000,
    billing: 'monthly',
    description: 'Heavy trucks, trailers, equipment',
    features: ['Heavy vehicles', 'Fleet contracts', 'Mobile mechanic', '24/7 emergency'],
    limits: { max_mechanics: 25, max_bays: 10, commission_rate: 8 },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 50000,
    billing: 'monthly',
    description: 'Unlimited scale for large operators',
    features: ['Unlimited mechanics', 'Unlimited bays', 'White-label', 'API access', 'Dedicated support'],
    limits: { max_mechanics: 999, max_bays: 999, commission_rate: 5 },
  },
] as const;

export async function subscribeGarage(garageId: string, planId: string) {
  const plan = GARAGE_SUBSCRIPTION_PLANS.find(p => p.id === planId);
  if (!plan) throw new Error('Invalid subscription plan');

  const now = new Date();
  const expiresAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  const { data, error } = await supabase
    .from('garages')
    .update({
      subscription_tier: planId,
      subscription_amount: plan.price,
      subscription_expires_at: expiresAt.toISOString(),
      subscription_status: 'active',
      commission_rate: plan.limits.commission_rate,
      updated_at: now.toISOString(),
    })
    .eq('id', garageId)
    .select()
    .single();

  if (error) throw error;
  return data as Garage;
}

// ─── Search ───

export async function searchGarages(query: string, filters?: GarageFilters) {
  let dbQuery = supabase
    .from('garages')
    .select('*')
    .eq('status', 'approved')
    .or(`business_name.ilike.%${query}%,city.ilike.%${query}%,specializations.cs.{${query}}`);

  if (filters?.city) dbQuery = dbQuery.ilike('city', `%${filters.city}%`);
  if (filters?.specialization) dbQuery = dbQuery.contains('specializations', [filters.specialization]);
  if (filters?.limit) dbQuery = dbQuery.limit(filters.limit);

  const { data, error } = await dbQuery;
  if (error) throw error;
  return (data || []) as Garage[];
}
