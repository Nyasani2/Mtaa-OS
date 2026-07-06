import { supabase } from '@/lib/supabase';
import { calculateFare, detectCountry, type FareEstimate } from '@/lib/services/fare-engine';

export type MTaxiAction =
  | 'request' | 'accept' | 'complete' | 'cancel'
  | 'onboard_vehicle' | 'inspection_payment' | 'inspection_complete' | 'vehicle_approval';

export interface MTaxiRequestParams {
  action: 'request';
  riderId: string;
  pickup: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  vehicleType: 'economy' | 'comfort' | 'premium' | 'xl' | 'truck';
  paymentMethod: 'wallet' | 'mpesa' | 'cash';
  estimatedFare: number;
  currency: string;
}

export interface MTaxiAcceptParams {
  action: 'accept';
  requestId: string;
  driverId: string;
  vehicleId: string;
}

export interface MTaxiCompleteParams {
  action: 'complete';
  tripId: string;
  driverId: string;
  finalFare: number;
  rating?: number;
  feedback?: string;
}

export interface MTaxiCancelParams {
  action: 'cancel';
  tripId: string;
  cancelledBy: 'rider' | 'driver';
  reason: string;
}

export interface MTaxiOnboardVehicleParams {
  action: 'onboard_vehicle';
  driverId: string;
  vehicleData: {
    make: string; model: string; year: number; plate: string;
    color: string; type: string; insurance: string; inspectionDue: string;
  };
}

export interface MTaxiInspectionPaymentParams {
  action: 'inspection_payment';
  vehicleId: string;
  driverId: string;
  amount: number;
  paymentMethod: 'wallet' | 'mpesa';
}

export interface MTaxiInspectionCompleteParams {
  action: 'inspection_complete';
  vehicleId: string;
  inspectorId: string;
  passed: boolean;
  notes?: string;
  nextDue?: string;
}

export interface MTaxiVehicleApprovalParams {
  action: 'vehicle_approval';
  vehicleId: string;
  approvedBy: string;
  status: 'approved' | 'rejected' | 'suspended';
  reason?: string;
}

export type MTaxiParams =
  | MTaxiRequestParams | MTaxiAcceptParams | MTaxiCompleteParams | MTaxiCancelParams
  | MTaxiOnboardVehicleParams | MTaxiInspectionPaymentParams | MTaxiInspectionCompleteParams | MTaxiVehicleApprovalParams;

export async function mtaxiOperation(params: MTaxiParams) {
  const { data, error } = await supabase.functions.invoke('mtaxi-operations', {
    body: params,
  });
  if (error) throw error;
  return data;
}

export const requestRide = (p: Omit<MTaxiRequestParams, 'action'>) =>
  mtaxiOperation({ action: 'request', ...p } as MTaxiRequestParams);

export const acceptRide = (p: Omit<MTaxiAcceptParams, 'action'>) =>
  mtaxiOperation({ action: 'accept', ...p } as MTaxiAcceptParams);

export const completeTrip = (p: Omit<MTaxiCompleteParams, 'action'>) =>
  mtaxiOperation({ action: 'complete', ...p } as MTaxiCompleteParams);

export const cancelTrip = (p: Omit<MTaxiCancelParams, 'action'>) =>
  mtaxiOperation({ action: 'cancel', ...p } as MTaxiCancelParams);

export const onboardVehicle = (p: Omit<MTaxiOnboardVehicleParams, 'action'>) =>
  mtaxiOperation({ action: 'onboard_vehicle', ...p } as MTaxiOnboardVehicleParams);

export const inspectionPayment = (p: Omit<MTaxiInspectionPaymentParams, 'action'>) =>
  mtaxiOperation({ action: 'inspection_payment', ...p } as MTaxiInspectionPaymentParams);

export const inspectionComplete = (p: Omit<MTaxiInspectionCompleteParams, 'action'>) =>
  mtaxiOperation({ action: 'inspection_complete', ...p } as MTaxiInspectionCompleteParams);

export const vehicleApproval = (p: Omit<MTaxiVehicleApprovalParams, 'action'>) =>
  mtaxiOperation({ action: 'vehicle_approval', ...p } as MTaxiVehicleApprovalParams);

export function getRideFareEstimate(
  pickup: { lat: number; lng: number; address?: string },
  destination: { lat: number; lng: number; address?: string },
  vehicleType: 'economy' | 'comfort' | 'premium' | 'xl' | 'truck' = 'economy',
  countryCode?: string
): FareEstimate {
  return calculateFare(pickup, destination, vehicleType, countryCode || detectCountry(pickup.lat, pickup.lng));
}

export async function getAvailableVehicles(lat: number, lng: number, radiusKm: number = 5) {
  const { data, error } = await supabase
    .from('mtaxi_vehicles')
    .select(`
      *,
      driver:driver_id(id, full_name, avatar_url, rating, total_trips)
    `)
    .eq('status', 'available')
    .gte('current_lat', lat - 0.045)
    .lte('current_lat', lat + 0.045)
    .gte('current_lng', lng - 0.045)
    .lte('current_lng', lng + 0.045)
    .limit(20);

  if (error) throw error;
  return data || [];
}

export function getVehicleTypes(countryCode: string = 'kenya') {
  const { getServiceTypes, getCountryInfo } = require('./fare-engine');
  const types = getServiceTypes(countryCode);
  const country = getCountryInfo(countryCode);

  return types
    .filter((t: any) => ['economy', 'comfort', 'premium', 'xl', 'truck'].includes(t.id))
    .map((t: any) => ({
      ...t,
      basePrice: Math.round(country.baseFare * t.baseMultiplier),
      currency: country.currency,
      currencySymbol: country.currencySymbol,
    }));
}

export async function checkDriverAvailability(lat: number, lng: number, vehicleType?: string): Promise<{
  available: boolean;
  count: number;
  etaMinutes?: number;
  message: string;
}> {
  try {
    const { data, error } = await supabase
      .from('mtaxi_vehicles')
      .select('*')
      .eq('status', 'available')
      .gte('current_lat', lat - 0.045)
      .lte('current_lat', lat + 0.045)
      .gte('current_lng', lng - 0.045)
      .lte('current_lng', lng + 0.045)
      .limit(20);

    if (error) throw error;

    const vehicles = data || [];
    const filtered = vehicleType
      ? vehicles.filter((v: any) => v.type === vehicleType)
      : vehicles;

    if (filtered.length === 0) {
      return {
        available: false,
        count: 0,
        message: 'No drivers available nearby. Try expanding your search or check back in a few minutes.',
      };
    }

    const avgEta = Math.ceil(filtered.length > 0 ? 3 + Math.random() * 7 : 0);

    return {
      available: true,
      count: filtered.length,
      etaMinutes: avgEta,
      message: `${filtered.length} driver${filtered.length > 1 ? 's' : ''} nearby · ETA ${avgEta} min`,
    };
  } catch (e) {
    return {
      available: false,
      count: 0,
      message: 'Unable to check driver availability. Please try again.',
    };
  }
}
